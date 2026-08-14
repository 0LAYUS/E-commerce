"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { WorkOrderTemplate } from "@/features/work-orders/types/work-order.types";
import { createWorkOrder } from "@/features/work-orders/actions/workOrderActions";

interface Props {
  template: WorkOrderTemplate;
}

export function CreateWorkOrderForm({ template }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit } = useForm();

  const properties = template.schema?.properties || {};

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError("");

    const { customer_name, customer_phone, customer_email, estimated_cost, ...custom_metadata } = data;

    const res = await createWorkOrder({
      customer_name,
      customer_phone,
      customer_email,
      estimated_cost: estimated_cost ? Number(estimated_cost) : undefined,
      custom_metadata,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else if (res?.data) {
      router.push(`/admin/work-orders/${res.data.id}`);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Nueva Orden de Trabajo - {template.name}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Nombre del Cliente *</Label>
              <Input id="customer_name" {...register("customer_name", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_phone">Teléfono del Cliente *</Label>
              <Input id="customer_phone" {...register("customer_phone", { required: true })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="customer_email">Correo Electrónico</Label>
              <Input id="customer_email" type="email" placeholder="Para recibir notificaciones" {...register("customer_email")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated_cost">Costo Estimado</Label>
            <Input id="estimated_cost" type="number" step="0.01" {...register("estimated_cost")} />
          </div>

          {Object.keys(properties).length > 0 && (
            <div className="pt-4 border-t mt-4">
              <h3 className="text-lg font-medium mb-4">Detalles del Servicio</h3>
              <div className="space-y-4">
                {Object.entries(properties).map(([key, fieldSchema]: [string, any]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{fieldSchema.title || key}</Label>
                    <Input 
                      id={key} 
                      type={fieldSchema.type === "number" ? "number" : "text"}
                      {...register(key, { required: fieldSchema.required })} 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creando..." : "Crear Orden"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
