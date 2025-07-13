import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart } from 'lucide-react';

export default function FinancialPanelPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Panel Financiero</h1>
      <Card>
        <CardHeader>
          <CardTitle>En Construcción</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground min-h-64">
            <PieChart className="h-16 w-16 mb-4" />
            <p className="text-lg">
              Esta sección está en desarrollo.
            </p>
            <p>
                Próximamente aquí encontrarás gráficos y análisis detallados de tus finanzas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
