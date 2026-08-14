"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { optimizeImage } from "@/shared/utils/imageOptimizer";
import { addEvidence } from "../actions/workOrderActions";
import { createClient } from "@/lib/supabase/client";

export function UploadEvidenceModal({ workOrderId }: { workOrderId: string }) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState("RECEIVED");
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (files.length === 0) return;
    if (files.length > 5) {
      alert("Puedes subir un máximo de 5 fotos a la vez.");
      return;
    }
    
    setIsUploading(true);
    
    try {
      const supabase = createClient();
      
      // Upload all files in parallel
      const uploadPromises = files.map(async (file) => {
        // 1. Optimize image locally
        const blob = await optimizeImage(file);
        
        // 2. Upload to Supabase Storage
        const fileName = `${workOrderId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}.webp`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("work_order_evidence")
          .upload(fileName, blob, {
            contentType: "image/webp",
            upsert: false
          });
          
        if (uploadError) throw new Error(uploadError.message);
        
        // 3. Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("work_order_evidence")
          .getPublicUrl(uploadData.path);
          
        // 4. Save record to DB
        const result = await addEvidence(workOrderId, stage, publicUrl, notes);
        if (result.error) throw new Error(result.error);
        
        return publicUrl;
      });

      await Promise.all(uploadPromises);
      
      setOpen(false);
      setFiles([]);
      setNotes("");
    } catch (err) {
      console.error(err);
      alert("Error al subir evidencia. Por favor intenta de nuevo.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Subir Evidencia</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir Nueva Evidencia</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">Fotos (JPEG, PNG) - Máx. 5</Label>
            <Input 
              id="file" 
              type="file" 
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  const selectedFiles = Array.from(e.target.files);
                  if (selectedFiles.length > 5) {
                    alert("Solo puedes seleccionar hasta 5 fotos.");
                    // Reset input
                    e.target.value = "";
                    setFiles([]);
                  } else {
                    setFiles(selectedFiles);
                  }
                }
              }}
            />
            {files.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {files.length} archivo(s) seleccionado(s).
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="stage">Etapa</Label>
            <Input 
              id="stage" 
              value={stage} 
              onChange={(e) => setStage(e.target.value)} 
              placeholder="Ej: RECEIVED, IN_PROGRESS"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Input 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
            />
          </div>
          <Button 
            className="w-full" 
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? "Subiendo..." : "Guardar Evidencia"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
