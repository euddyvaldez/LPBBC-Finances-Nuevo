
'use client';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';

type ChartProps = {
  chartType: 'line' | 'bar' | 'pie';
  data: { name: string; ingresos: number; gastos: number; inversion: number }[];
};

const COLORS = {
  ingresos: '#22c55e', // green-500
  gastos: '#ef4444', // red-500
  inversion: '#f59e0b', // amber-500
};

export function FinancialChart({ chartType, data }: ChartProps) {
  const pieData = [
    { name: 'Ingresos', value: data.reduce((sum, item) => sum + item.ingresos, 0) },
    { name: 'Gastos', value: data.reduce((sum, item) => sum + item.gastos, 0) },
    { name: 'Inversión', value: data.reduce((sum, item) => sum + item.inversion, 0) },
  ].filter(item => item.value > 0);


  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
            <Tooltip formatter={(value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)} />
            <Legend />
            <Bar dataKey="ingresos" fill={COLORS.ingresos} name="Ingresos" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gastos" fill={COLORS.gastos} name="Gastos" radius={[4, 4, 0, 0]} />
            <Bar dataKey="inversion" fill={COLORS.inversion} name="Inversión" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
            <Tooltip formatter={(value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)} />
            <Legend />
            <Line type="monotone" dataKey="ingresos" stroke={COLORS.ingresos} name="Ingresos" />
            <Line type="monotone" dataKey="gastos" stroke={COLORS.gastos} name="Gastos" />
            <Line type="monotone" dataKey="inversion" stroke={COLORS.inversion} name="Inversión" />
          </LineChart>
        );
      case 'pie':
        return (
          <RechartsPieChart>
            <Tooltip formatter={(value: number, name) => [new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value), name]}/>
            <Legend />
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                 {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
                 ))}
            </Pie>
          </RechartsPieChart>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>{renderChart()}</ResponsiveContainer>
    </div>
  );
}

