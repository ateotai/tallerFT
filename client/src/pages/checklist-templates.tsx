import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Role, Permission, RolePermission } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Pencil, Copy, Ban, CheckCircle2, MoreHorizontal } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type Section = { title: string; items: string[] };

export default function ChecklistTemplatesPage() {
  const { user } = useAuth();
  const roleText = (user?.role || "").toLowerCase();
  const isAdmin = /admin|administrador/.test(roleText);
  const { data: roles = [] } = useQuery<Role[]>({ queryKey: ["/api/roles"] });
  const canManageTemplates = isAdmin;
  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ["/api/checklist-templates", { activeOnly: true, unique: true }],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/checklist-templates?activeOnly=true&unique=true");
      return await res.json();
    },
    enabled: canManageTemplates,
  });

  const [rolesByTemplate, setRolesByTemplate] = useState<Record<number, number[]>>({});
  useEffect(() => {
    if (!templates.length) return;
    const toFetch = templates.filter((t) => !(t.id in rolesByTemplate));
    if (!toFetch.length) return;
    Promise.all(
      toFetch.map(async (t) => {
        const res = await apiRequest("GET", `/api/checklist-templates/${t.id}`);
        const data = await res.json();
        return { id: t.id as number, roleIds: Array.isArray(data.roleIds) ? data.roleIds : (Array.isArray(t.roleIds) ? t.roleIds : []) };
      })
    ).then((rows) => {
      const next: Record<number, number[]> = {};
      for (const r of rows) next[r.id] = r.roleIds;
      setRolesByTemplate((prev) => ({ ...prev, ...next }));
    }).catch(() => {});
  }, [templates, rolesByTemplate]);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmToggleId, setConfirmToggleId] = useState<number | null>(null);
  const [desiredActive, setDesiredActive] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("express");
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [sections, setSections] = useState<Section[]>([{ title: "Nueva sección", items: ["Nuevo ítem"] }]);

  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = { name, description, type, sections, active: true, roleIds };
      const res = await apiRequest("POST", "/api/checklist-templates", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates"] });
      toast({ title: "Plantilla creada", description: "La plantilla de revisión fue registrada." });
      setOpen(false);
      setName("");
      setDescription("");
      setType("express");
      setRoleIds([]);
      setSections([{ title: "Nueva sección", items: ["Nuevo ítem"] }]);
      setEditingId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "No se pudo crear la plantilla", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const payload = { name, description, type, sections, active: true, roleIds } as any;
      const res = await apiRequest("PUT", `/api/checklist-templates/${editingId}`, payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates"] });
      toast({ title: "Plantilla actualizada", description: "Se guardaron los cambios." });
      setOpen(false);
      setEditingId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "No se pudo actualizar la plantilla", variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      if (!confirmToggleId || desiredActive === null) return;
      const payload = { active: desiredActive } as any;
      const res = await apiRequest("PUT", `/api/checklist-templates/${confirmToggleId}`, payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates"] });
      setConfirmToggleId(null);
      setDesiredActive(null);
      toast({ title: "Estado actualizado", description: "La plantilla fue actualizada." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "No se pudo actualizar el estado", variant: "destructive" });
    },
  });

  if (!canManageTemplates) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Plantillas de Revisiones</h2>
        <div className="rounded-md border p-6 text-sm text-muted-foreground">No autorizado para administrar plantillas</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Plantillas de Revisiones</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Crear Plantilla</Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar plantilla" : "Nueva plantilla"}</DialogTitle>
              <DialogDescription>{editingId ? "Modifica la configuración de tu plantilla." : "Define secciones e ítems y asigna roles."}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 p-2 sm:p-3 md:p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nombre</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Plantilla Chofer" />
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="express">Express</SelectItem>
                      <SelectItem value="completo">Completo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Revisión orientada al rol chofer" />
              </div>
              <div>
                <label className="text-sm font-medium">Roles aplicables</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {roles.map((r) => {
                    const checked = roleIds.includes(r.id);
                    return (
                      <Button
                        key={r.id}
                        type="button"
                        variant={checked ? "default" : "outline"}
                        onClick={() => setRoleIds((prev) => checked ? prev.filter((id) => id !== r.id) : [...prev, r.id])}
                        className="h-9 w-full sm:w-auto px-3"
                      >
                        {r.name}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Secciones</h3>
                  <Button type="button" variant="outline" onClick={() => setSections((prev) => [...prev, { title: "Nueva sección", items: ["Nuevo ítem"] }])}>Agregar sección</Button>
                </div>
                {sections.map((sec, sIdx) => (
                  <Card key={sIdx}>
                    <CardHeader>
                      <CardTitle className="text-base">Sección</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Input value={sec.title} onChange={(e) => setSections((prev) => prev.map((p, i) => i===sIdx ? { ...p, title: e.target.value } : p))} placeholder="Título de sección" />
                      <div className="space-y-2">
                        {sec.items.map((it, iIdx) => (
                          <div key={iIdx} className="flex flex-col sm:flex-row gap-2">
                            <Input className="w-full" value={it} onChange={(e) => setSections((prev) => prev.map((p, i) => i===sIdx ? { ...p, items: p.items.map((ii, j) => j===iIdx ? e.target.value : ii) } : p))} placeholder="Nombre del ítem" />
                            <Button type="button" variant="outline" className="sm:w-auto w-full" onClick={() => setSections((prev) => prev.map((p, i) => i===sIdx ? { ...p, items: p.items.filter((_, j) => j!==iIdx) } : p))}>Eliminar</Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setSections((prev) => prev.map((p, i) => i===sIdx ? { ...p, items: [...p.items, "Nuevo ítem"] } : p))}>Agregar ítem</Button>
                      </div>
                      <div className="flex justify-end">
                        <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={() => setSections((prev) => prev.filter((_, i) => i!==sIdx))}>Eliminar sección</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => { setOpen(false); setEditingId(null); }}>Cancelar</Button>
              {editingId ? (
                <Button type="button" className="w-full sm:w-auto" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>{updateMutation.isPending ? "Guardando..." : "Guardar cambios"}</Button>
              ) : (
                <Button type="button" className="w-full sm:w-auto" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>{createMutation.isPending ? "Guardando..." : "Guardar"}</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plantillas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card shadow-sm overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-[24%]">Nombre</TableHead>
                  <TableHead className="w-[12%]">Tipo</TableHead>
                  <TableHead className="w-[28%]">Roles</TableHead>
                  <TableHead className="w-[10%]">Secciones</TableHead>
                  <TableHead className="w-[10%]">Estado</TableHead>
                  <TableHead className="w-[16%] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay plantillas registradas</TableCell>
                  </TableRow>
                ) : templates.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.type}</TableCell>
                    <TableCell className="text-sm">
                      {(() => {
                        const ids: number[] = Array.isArray(t.roleIds) && t.roleIds.length ? t.roleIds : (rolesByTemplate[t.id] || []);
                        let names: string[] = Array.isArray((t as any).roleNames) && (t as any).roleNames.length ? (t as any).roleNames : [];
                        if (!names.length) {
                          names = roles.filter((r) => ids.includes(r.id)).map((r) => r.name);
                        }
                        return names.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {names.map((n, i) => (
                              <span key={i} className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs">
                                {n}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sin roles</span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>{t.sections?.length || 0}</TableCell>
                    <TableCell>{t.active ? "Activa" : "Inactiva"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" aria-label="Acciones">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={async () => {
                              const res = await apiRequest("GET", `/api/checklist-templates/${t.id}`);
                              const data = await res.json();
                              setEditingId(t.id);
                              setName(data.name || "");
                              setDescription(data.description || "");
                              setType(data.type || "express");
                              setSections(Array.isArray(data.sections) ? data.sections : []);
                              setRoleIds(Array.isArray(data.roleIds) ? data.roleIds : []);
                              setOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              const res = await apiRequest("GET", `/api/checklist-templates/${t.id}`);
                              const data = await res.json();
                              setEditingId(null);
                              setName(`${data.name || "Plantilla"} (Copia)`);
                              setDescription(data.description || "");
                              setType(data.type || "express");
                              setSections(Array.isArray(data.sections) ? data.sections : []);
                              setRoleIds(Array.isArray(data.roleIds) ? data.roleIds : []);
                              setOpen(true);
                            }}
                          >
                            <Copy className="h-4 w-4" /> Clonar
                          </DropdownMenuItem>
                          {t.active ? (
                            <DropdownMenuItem onClick={() => { setConfirmToggleId(t.id); setDesiredActive(false); }}>
                              <Ban className="h-4 w-4" /> Desactivar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => { setConfirmToggleId(t.id); setDesiredActive(true); }}>
                              <CheckCircle2 className="h-4 w-4" /> Activar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmToggleId !== null} onOpenChange={(o) => !o && (setConfirmToggleId(null), setDesiredActive(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{desiredActive ? "Activar plantilla" : "Desactivar plantilla"}</AlertDialogTitle>
            <AlertDialogDescription>{desiredActive ? "La plantilla quedará disponible para uso." : "La plantilla no se podrá usar hasta activarla."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setConfirmToggleId(null); setDesiredActive(null); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => toggleActiveMutation.mutate()}>{desiredActive ? "Activar" : "Desactivar"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
