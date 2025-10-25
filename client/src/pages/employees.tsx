import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeesTable } from "@/components/employees-table";
import { AddEmployeeDialog } from "@/components/add-employee-dialog";
import { EmployeeTypesTable } from "@/components/employee-types-table";
import { AddEmployeeTypeDialog } from "@/components/add-employee-type-dialog";
import type { Employee, EmployeeType } from "@shared/schema";

export default function EmployeesPage() {
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: employeeTypes = [], isLoading: isLoadingTypes } = useQuery<EmployeeType[]>({
    queryKey: ["/api/employee-types"],
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Empleados</h1>
        <p className="text-muted-foreground">
          Gestión de empleados del taller y tipos de empleado
        </p>
      </div>

      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList>
          <TabsTrigger value="employees" data-testid="tab-employees">
            Empleados
          </TabsTrigger>
          <TabsTrigger value="types" data-testid="tab-employee-types">
            Tipos de Empleado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Empleados del Taller</h2>
              <p className="text-muted-foreground mt-1">
                Administra los empleados y su información de usuario
              </p>
            </div>
            <AddEmployeeDialog />
          </div>

          {isLoadingEmployees ? (
            <div className="text-center py-12 text-muted-foreground">
              Cargando empleados...
            </div>
          ) : (
            <EmployeesTable employees={employees} />
          )}
        </TabsContent>

        <TabsContent value="types" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Tipos de Empleado</h2>
              <p className="text-muted-foreground mt-1">
                Administra las categorías de empleados
              </p>
            </div>
            <AddEmployeeTypeDialog />
          </div>

          {isLoadingTypes ? (
            <div className="text-center py-12 text-muted-foreground">
              Cargando tipos...
            </div>
          ) : (
            <EmployeeTypesTable employeeTypes={employeeTypes} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
