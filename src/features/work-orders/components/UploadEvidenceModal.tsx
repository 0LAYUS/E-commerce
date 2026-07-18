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
import { addEvidence } from "../../actions/workOrderActions";
import { createClient } from "@/lib/supabase/client";

export function UploadEvidenceModal({ workOrderId }: { workOrderId: string }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState("RECEIVED");
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    
    try {
      // 1. Optimize image locally
      const blob = await optimizeImage(file);
      
      // 2. Upload to Supabase Storage
      const supabase = createClient();
      const fileName = `${workOrderId}/${Date.now()}-${file.name}.webp`;
      
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
      
      setOpen(false);
      setFile(null);
      setNotes("");
    } catch (err) {
      console.error(err);
      alert("Error al subir evidencia.");
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
            <Label htmlFor="file">Foto (JPEG, PNG)</Label>
            <Input 
              id="file" 
              type="file" 
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
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
            disabled={!file || isUploading}
          >
            {isUploading ? "Subiendo..." : "Guardar Evidencia"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
