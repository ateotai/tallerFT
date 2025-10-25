import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Plus, Upload, X, Image as ImageIcon, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import type { InsertReport } from "@shared/schema";
import { z } from "zod";

const formSchema = insertReportSchema.extend({
  image: z.any().optional(),
  audio: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddIssueReportDialog() {
  const [open, setOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleId: undefined,
      userId: 1,
      description: "",
      notes: "",
      status: "pending",
      imageUrl: undefined,
      audioUrl: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertReport) => {
      return await apiRequest("POST", "/api/reports", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Reporte creado",
        description: "El reporte ha sido creado exitosamente",
      });
      setOpen(false);
      form.reset();
      setImagePreview(null);
      setAudioPreview(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear el reporte",
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
    createMutation.mutate(reportData as InsertReport);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-issue-report">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Reporte
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Reporte de Desperfecto</DialogTitle>
          <DialogDescription>
            Registra un nuevo desperfecto o servicio requerido para un vehículo
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
                      data-testid="input-description"
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
                      data-testid="input-notes"
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
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-status">
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
                        data-testid="image-preview"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                        data-testid="button-remove-image"
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
                        data-testid="input-image"
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
                      <audio controls className="flex-1" data-testid="audio-preview">
                        <source src={audioPreview} />
                      </audio>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={removeAudio}
                        data-testid="button-remove-audio"
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
                        data-testid="input-audio"
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
                onClick={() => setOpen(false)}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending ? "Creando..." : "Crear Reporte"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
