import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Upload, X, Image as ImageIcon, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { VehicleSearchCombobox } from "./vehicle-search-combobox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertReportSchema } from "@shared/schema";
import type { Report, InsertReport } from "@shared/schema";
import { z } from "zod";

const formSchema = insertReportSchema.extend({
  image: z.any().optional(),
  audio: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditIssueReportDialogProps {
  report: Report;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditIssueReportDialog({ report, open, onOpenChange }: EditIssueReportDialogProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(report.imageUrl || null);
  const [audioPreview, setAudioPreview] = useState<string | null>(report.audioUrl || null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleId: report.vehicleId,
      userId: report.userId,
      description: report.description,
      notes: report.notes || "",
      status: report.status,
      imageUrl: report.imageUrl || undefined,
      audioUrl: report.audioUrl || undefined,
    },
  });

  useEffect(() => {
    if (report) {
      form.reset({
        vehicleId: report.vehicleId,
        userId: report.userId,
        description: report.description,
        notes: report.notes || "",
        status: report.status,
        imageUrl: report.imageUrl || undefined,
        audioUrl: report.audioUrl || undefined,
      });
      setImagePreview(report.imageUrl || null);
      setAudioPreview(report.audioUrl || null);
    }
  }, [report, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: InsertReport) => {
      return await apiRequest("PUT", `/api/reports/${report.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Reporte actualizado",
        description: "El reporte ha sido actualizado exitosamente",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el reporte",
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        form.setValue("imageUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAudioPreview(reader.result as string);
        form.setValue("audioUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue("imageUrl", undefined);
  };

  const removeAudio = () => {
    setAudioPreview(null);
    form.setValue("audioUrl", undefined);
  };

  function onSubmit(values: FormValues) {
    const { image, audio, ...reportData } = values;
    updateMutation.mutate(reportData as InsertReport);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Reporte</DialogTitle>
          <DialogDescription>
            Actualiza la información del reporte de desperfecto
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehículo *</FormLabel>
                  <FormControl>
                    <VehicleSearchCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción de la Falla *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el desperfecto o servicio requerido..."
                      className="min-h-[100px]"
                      data-testid="input-edit-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Adicionales</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Información adicional, observaciones..."
                      data-testid="input-edit-notes"
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-status">
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="in_progress">En Proceso</SelectItem>
                      <SelectItem value="resolved">Resuelto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div>
                <FormLabel>Imagen</FormLabel>
                <div className="mt-2">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full h-48 object-contain rounded border"
                        data-testid="edit-image-preview"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                        data-testid="button-edit-remove-image"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageChange}
                        className="hidden"
                        data-testid="input-edit-image"
                      />
                      <Button type="button" variant="outline" asChild>
                        <span>
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Subir / Tomar Foto
                        </span>
                      </Button>
                    </label>
                  )}
                </div>
              </div>

              <div>
                <FormLabel>Audio</FormLabel>
                <div className="mt-2">
                  {audioPreview ? (
                    <div className="flex items-center gap-2">
                      <audio controls className="flex-1" data-testid="edit-audio-preview">
                        <source src={audioPreview} />
                      </audio>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={removeAudio}
                        data-testid="button-edit-remove-audio"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="file"
                        accept="audio/*"
                        capture="microphone"
                        onChange={handleAudioChange}
                        className="hidden"
                        data-testid="input-edit-audio"
                      />
                      <Button type="button" variant="outline" asChild>
                        <span>
                          <Mic className="h-4 w-4 mr-2" />
                          Subir / Grabar Audio
                        </span>
                      </Button>
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-edit-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-testid="button-edit-submit"
              >
                {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
