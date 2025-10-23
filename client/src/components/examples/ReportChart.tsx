import { ReportChart } from "../report-chart";

export default function ReportChartExample() {
  const costData = [
    { name: "Ene", value: 12500 },
    { name: "Feb", value: 15300 },
    { name: "Mar", value: 18200 },
    { name: "Abr", value: 14800 },
    { name: "May", value: 21400 },
    { name: "Jun", value: 19600 },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      <ReportChart
        type="bar"
        title="Gastos Mensuales por Mantenimiento"
        data={costData}
        dataKey="value"
        xKey="name"
      />
    </div>
  );
}
