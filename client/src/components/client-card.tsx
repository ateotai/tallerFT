import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Phone, Mail, MapPin, Eye, MoreHorizontal, Pencil, Trash2, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { EditClientDialog } from "@/components/edit-client-dialog";
import type { Client, ClientBranch, Vehicle } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AddClientBranchDialog } from "@/components/add-client-dialog";
import { useToast } from "@/hooks/use-toast";

interface ClientCardProps {
  client: Client;
}

const statusConfig = {
  active: { label: "Activo", className: "border-green-600 text-green-600" },
  inactive: { label: "Inactivo", className: "border-gray-600 text-gray-600" },
};

export function ClientCard({ client }: ClientCardProps) {
  const [editingClient, setEditingClient] = useState(false);
  const [deletingClient, setDeletingClient] = useState(false);
  const [showBranches, setShowBranches] = useState(false);
  const { toast } = useToast();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/clients/${client.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado exitosamente.",
      });
      setDeletingClient(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el cliente",
        variant: "destructive",
      });
    },
  });

  const status = client.status as keyof typeof statusConfig;
  const statusInfo = statusConfig[status] ?? { label: String(client.status || "-"), className: "border-gray-600 text-gray-600" };

  return (
    <>
      <Card className="hover-elevate" data-testid={`card-client-${client.id}`}>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg" data-testid={`text-client-name-${client.id}`}>
                  {client.name}
                </h3>
                {client.company && (
                  <p className="text-sm text-muted-foreground">{client.company}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusInfo?.className ?? "border-gray-600 text-gray-600"}>
                {statusInfo?.label ?? String(client.status || "-")}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid={`button-more-${client.id}`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingClient(true)} data-testid={`button-edit-${client.id}`}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => setDeletingClient(true)}
                    data-testid={`button-delete-${client.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span data-testid={`text-phone-${client.id}`}>{client.phone}</span>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="break-all" data-testid={`text-email-${client.id}`}>{client.email}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-muted-foreground">{client.address}</span>
            </div>
          </div>

          <BranchesSection client={client} show={showBranches} onToggle={() => setShowBranches((v) => !v)} />
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" data-testid={`button-view-client-${client.id}`}>
            <Eye className="h-4 w-4 mr-1" />
            Ver Detalles
          </Button>
        </CardFooter>
      </Card>

      {editingClient && (
        <EditClientDialog
          client={client}
          open={editingClient}
          onOpenChange={setEditingClient}
        />
      )}

      <AlertDialog open={deletingClient} onOpenChange={setDeletingClient}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el cliente permanentemente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function BranchesSection({ client, show, onToggle }: { client: Client; show: boolean; onToggle: () => void }) {
  const { data: branches = [], isLoading } = useQuery<ClientBranch[]>({
    queryKey: ["/api/client-branches", client.id],
    queryFn: async () => {
      const res = await fetch(`/api/client-branches?clientId=${client.id}`);
      if (!res.ok) return [];
      return await res.json();
    },
  });
  const { data: vehicles = [] } = useQuery<Vehicle[]>({ queryKey: ["/api/vehicles"] });

  const countByBranch: Record<number, number> = {};
  for (const v of vehicles) {
    if (v.branchId) countByBranch[v.branchId] = (countByBranch[v.branchId] || 0) + 1;
  }

  return (
    <div className="mt-4 border rounded-md">
      <button
        className="w-full flex justify-between items-center px-3 py-2 text-sm"
        onClick={onToggle}
      >
        <span className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Sucursales</span>
        {show ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {show && (
        <div className="px-3 pb-3">
          {isLoading ? (
            <div className="text-muted-foreground text-sm">Cargando sucursales...</div>
          ) : branches.length === 0 ? (
            <div className="text-muted-foreground text-sm">Sin sucursales</div>
          ) : (
            <ul className="space-y-2">
              {branches.map((b) => (
                <li key={b.id} className="flex justify-between items-center">
                  <span className="font-medium">{b.name}</span>
                  <span className="text-xs text-muted-foreground">Vehículos: {countByBranch[b.id] || 0}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3">
            <AddClientBranchDialog clientId={client.id} />
          </div>
        </div>
      )}
    </div>
  );
}
