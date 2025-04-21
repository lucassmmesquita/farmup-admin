// src/pages/index.tsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  //Card, 
  //CardContent, 
  //CardHeader, 
  //CardActions, 
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  CircularProgress
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  Warning, 
  //Check, 
  //Store, 
  //Person,
  ShoppingCart,
  Assignment,
  PriorityHigh
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  BarChart, 
  Bar 
} from 'recharts';
import { firestore } from '../services/firebase/firebaseConfig';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

// Interface para os KPIs do Dashboard
interface KPI {
  name: string;
  value: string | number;
  previousValue?: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

// Dados de planos de ação pendentes
interface ActionPlan {
  id: string;
  title: string;
  pharmacyName: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'validated' | 'rejected';
}

// Interfaces para dados de performance
interface Performance {
  date: string;
  uvc: number;
  ticketMedio: number;
  precoMedio: number;
}

interface Pharmacy {
  id: string;
  name: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [pendingActions, setPendingActions] = useState<ActionPlan[]>([]);
  const [pendingEvidences, setPendingEvidences] = useState<number>(0);
  const [performanceData, setPerformanceData] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>('all');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Carregar farmácias
        const pharmaciesRef = collection(firestore, 'pharmacies');
        const pharmaciesSnapshot = await getDocs(pharmaciesRef);
        
        const pharmaciesList: Pharmacy[] = [];
        pharmaciesSnapshot.forEach((doc) => {
          pharmaciesList.push({
            id: doc.id,
            name: doc.data().name
          });
        });
        
        setPharmacies(pharmaciesList);
        
        // Carregar dados de KPIs e performance (mockados, em produção viriam da API)
        const mockKpis: KPI[] = [
          {
            name: 'UVC Médio',
            value: '2.3',
            previousValue: '2.1',
            change: 9.5,
            trend: 'up',
            icon: <ShoppingCart />
          },
          {
            name: 'Ticket Médio',
            value: 'R$ 97,53',
            previousValue: 'R$ 93,21',
            change: 4.6,
            trend: 'up',
            icon: <TrendingUp />
          },
          {
            name: 'Preço Médio',
            value: 'R$ 42,40',
            previousValue: 'R$ 44,38',
            change: -4.5,
            trend: 'down',
            icon: <TrendingDown />
          },
          {
            name: 'Planos de Ação',
            value: 14,
            previousValue: 8,
            change: 75,
            trend: 'up',
            icon: <Assignment />
          }
        ];
        
        setKpis(mockKpis);
        
        // Carregar planos de ação pendentes
        const actionsRef = collection(firestore, 'actionPlans');
        const actionsQuery = query(
          actionsRef, 
          where('status', 'in', ['pending', 'in_progress']),
          orderBy('priority', 'asc'),
          limit(5)
        );
        
        const actionsSnapshot = await getDocs(actionsQuery);
        
        const actionsList: ActionPlan[] = [];
        actionsSnapshot.forEach((doc) => {
          actionsList.push({
            id: doc.id,
            ...doc.data() as Omit<ActionPlan, 'id'>
          });
        });
        
        setPendingActions(actionsList);
        
        // Carregar contagem de evidências pendentes
        const evidencesRef = collection(firestore, 'evidences');
        const evidencesQuery = query(
          evidencesRef, 
          where('status', '==', 'pending')
        );
        
        const evidencesSnapshot = await getDocs(evidencesQuery);
        setPendingEvidences(evidencesSnapshot.size);
        
        // Dados de performance (mockados para exemplo)
        const mockPerformanceData: Performance[] = [
          { date: '01/04', uvc: 2.1, ticketMedio: 90.5, precoMedio: 43.1 },
          { date: '02/04', uvc: 2.2, ticketMedio: 91.2, precoMedio: 41.5 },
          { date: '03/04', uvc: 1.9, ticketMedio: 89.8, precoMedio: 47.3 },
          { date: '04/04', uvc: 2.3, ticketMedio: 94.7, precoMedio: 41.2 },
          { date: '05/04', uvc: 2.4, ticketMedio: 95.3, precoMedio: 39.7 },
          { date: '06/04', uvc: 2.5, ticketMedio: 96.1, precoMedio: 38.4 },
          { date: '07/04', uvc: 2.3, ticketMedio: 97.5, precoMedio: 42.4 }
        ];
        
        setPerformanceData(mockPerformanceData);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handlePharmacyChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedPharmacy(event.target.value as string);
    
    // Aqui você carregaria dados filtrados por farmácia
    // e atualizaria o estado com os novos dados
  };

  // Mapas para cores por prioridade
  const priorityColors = {
    high: 'error',
    medium: 'warning',
    low: 'info'
  };

  // Mapa para labels de prioridade
  const priorityLabels = {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa'
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard Geral
        </Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Farmácia</InputLabel>
          <Select
            value={selectedPharmacy}
            onChange={handlePharmacyChange as any}
            label="Farmácia"
          >
            <MenuItem value="all">Todas as Farmácias</MenuItem>
            {pharmacies.map(pharmacy => (
              <MenuItem key={pharmacy.id} value={pharmacy.id}>
                {pharmacy.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      {/* KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpis.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {kpi.name}
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', my: 1 }}>
                    {kpi.value}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {kpi.trend === 'up' ? (
                      <TrendingUp fontSize="small" color="success" />
                    ) : kpi.trend === 'down' ? (
                      <TrendingDown fontSize="small" color="error" />
                    ) : (
                      <TrendingDown fontSize="small" color="action" />
                    )}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        ml: 0.5,
                        color: kpi.trend === 'up' 
                          ? 'success.main' 
                          : kpi.trend === 'down' 
                            ? 'error.main' 
                            : 'text.secondary'
                      }}
                    >
                      {kpi.change > 0 ? '+' : ''}{kpi.change}%
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ 
                  bgcolor: 'action.hover', 
                  borderRadius: '50%', 
                  p: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {kpi.icon}
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      {/* Gráficos e Alertas */}
      <Grid container spacing={3}>
        {/* Gráfico de Performance */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Evolução de Indicadores
            </Typography>
            <Box sx={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={performanceData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="uvc" 
                    name="UVC" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="ticketMedio" 
                    name="Ticket Médio" 
                    stroke="#82ca9d" 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="precoMedio" 
                    name="Preço Médio" 
                    stroke="#ffc658" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Alertas e Pendências */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Pendências
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  bgcolor: 'warning.light', 
                  color: 'warning.dark',
                  p: 1,
                  borderRadius: 1
                }}
              >
                <Warning sx={{ mr: 1 }} />
                <Typography variant="body1">
                  {pendingEvidences} evidências pendentes de validação
                </Typography>
              </Box>
              
              <Button 
                variant="outlined" 
                sx={{ mt: 1 }}
                onClick={() => router.push('/evidences')}
                fullWidth
              >
                Ver Evidências
              </Button>
            </Box>
            
            <Typography variant="subtitle1" gutterBottom>
              Planos de Ação Pendentes
            </Typography>
            
            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {pendingActions.length === 0 ? (
                <ListItem>
                  <ListItemText 
                    primary="Nenhum plano pendente" 
                    secondary="Todos os planos de ação estão concluídos!" 
                  />
                </ListItem>
              ) : (
                pendingActions.map((action, index) => (
                  <React.Fragment key={action.id}>
                    <ListItem 
                      button 
                      onClick={() => router.push(`/action-plans/view/${action.id}`)}
                    >
                      <ListItemIcon>
                        <PriorityHigh color={priorityColors[action.priority] as any} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={action.title} 
                        secondary={action.pharmacyName} 
                        primaryTypographyProps={{ noWrap: true }}
                      />
                      <Chip 
                        label={priorityLabels[action.priority]} 
                        color={priorityColors[action.priority] as any}
                        size="small"
                      />
                    </ListItem>
                    {index < pendingActions.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </List>
            
            <Button 
              variant="contained" 
              sx={{ mt: 2 }}
              onClick={() => router.push('/action-plans')}
            >
              Ver Todos os Planos
            </Button>
          </Paper>
        </Grid>
        
        {/* Indicadores por Farmácia */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Perfomance por Farmácia
            </Typography>
            <Box sx={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Farmácia 1', uvc: 2.5, ticketMedio: 103.4 },
                    { name: 'Farmácia 2', uvc: 2.1, ticketMedio: 92.7 },
                    { name: 'Farmácia 3', uvc: 2.8, ticketMedio: 97.2 },
                    { name: 'Farmácia 4', uvc: 1.9, ticketMedio: 87.5 },
                    { name: 'Farmácia 5', uvc: 2.3, ticketMedio: 95.1 }
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="uvc" name="UVC" fill="#8884d8" />
                  <Bar dataKey="ticketMedio" name="Ticket Médio" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
};

export default Dashboard;