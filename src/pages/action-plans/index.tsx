// src/pages/action-plans/index.tsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../../services/firebase/firebaseConfig';

interface ActionPlan {
  id: string;
  title: string;
  description: string;
  steps: string[];
  products?: string[];
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  indicatorId: string;
  flowType: 'faturamento' | 'cupom';
}

interface Indicator {
  id: string;
  name: string;
  flowType: 'faturamento' | 'cupom';
  isPrimary: boolean;
}

const ActionPlansPage: React.FC = () => {
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [flowType, setFlowType] = useState<'faturamento' | 'cupom'>('faturamento');
  const [filterIndicator, setFilterIndicator] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar indicadores
        const indicatorsRef = collection(firestore, 'indicators');
        const indicatorsSnapshot = await getDocs(indicatorsRef);
        
        const indicatorsList: Indicator[] = [];
        indicatorsSnapshot.forEach((doc) => {
          indicatorsList.push({
            id: doc.id,
            ...doc.data() as Omit<Indicator, 'id'>
          });
        });
        
        setIndicators(indicatorsList);
        
        // Buscar planos de ação
        const actionPlansRef = collection(firestore, 'actionPlans');
        let actionPlansQuery = query(actionPlansRef);
        
        // Filtrar por tipo de fluxo
        actionPlansQuery = query(actionPlansQuery, where('flowType', '==', flowType));
        
        // Filtrar por indicador se houver seleção
        if (filterIndicator !== 'all') {
          actionPlansQuery = query(actionPlansQuery, where('indicatorId', '==', filterIndicator));
        }
        
        // Filtrar por prioridade se houver seleção
        if (filterPriority !== 'all') {
          actionPlansQuery = query(actionPlansQuery, where('priority', '==', filterPriority));
        }
        
        const actionPlansSnapshot = await getDocs(actionPlansQuery);
        
        const actionPlansList: ActionPlan[] = [];
        actionPlansSnapshot.forEach((doc) => {
          actionPlansList.push({
            id: doc.id,
            ...doc.data() as Omit<ActionPlan, 'id'>
          });
        });
        
        setActionPlans(actionPlansList);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [flowType, filterIndicator, filterPriority]);

  const handleFlowTypeChange = (_: React.SyntheticEvent, newValue: 'faturamento' | 'cupom') => {
    setFlowType(newValue);
    setFilterIndicator('all'); // Reset do filtro
  };

  const handleFilterChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    if (name === 'indicator') {
      setFilterIndicator(value as string);
    } else if (name === 'priority') {
      setFilterPriority(value as string);
    }
  };

  // Filtragem por termo de busca
  const filteredActionPlans = actionPlans.filter(
    plan => plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            plan.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obter nome do indicador
  const getIndicatorName = (id: string) => {
    const indicator = indicators.find(i => i.id === id);
    return indicator ? indicator.name : 'Desconhecido';
  };

  // Mapeamento de cores para prioridade
  const priorityColors = {
    high: 'error',
    medium: 'warning',
    low: 'info'
  };

  // Mapeamento de textos para prioridade
  const priorityLabels = {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa'
  };

  return (
    <DashboardLayout title="Gestão de Planos de Ação">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Planos de Ação
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => router.push('/action-plans/create')}
        >
          Novo Plano de Ação
        </Button>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={flowType} onChange={handleFlowTypeChange}>
          <Tab label="Faturamento" value="faturamento" />
          <Tab label="Cupom" value="cupom" />
        </Tabs>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar plano de ação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Indicador</InputLabel>
            <Select
              name="indicator"
              value={filterIndicator}
              onChange={handleFilterChange as any}
              label="Indicador"
            >
              <MenuItem value="all">Todos</MenuItem>
              {indicators
                .filter(i => i.flowType === flowType && i.isPrimary)
                .map(indicator => (
                  <MenuItem key={indicator.id} value={indicator.id}>
                    {indicator.name}
                  </MenuItem>
                ))
              }
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Prioridade</InputLabel>
            <Select
              name="priority"
              value={filterPriority}
              onChange={handleFilterChange as any}
              label="Prioridade"
            >
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="high">Alta</MenuItem>
              <MenuItem value="medium">Média</MenuItem>
              <MenuItem value="low">Baixa</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell>Indicador</TableCell>
                <TableCell>Prioridade</TableCell>
                <TableCell>Prazo</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Carregando...</TableCell>
                </TableRow>
              ) : filteredActionPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Nenhum plano de ação encontrado</TableCell>
                </TableRow>
              ) : (
                filteredActionPlans.map((plan) => (
                  <TableRow key={plan.id} hover>
                    <TableCell>{plan.title}</TableCell>
                    <TableCell>{getIndicatorName(plan.indicatorId)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={priorityLabels[plan.priority]} 
                        color={priorityColors[plan.priority] as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{plan.deadline}</TableCell>
                    <TableCell align="right">
                      <IconButton 
                        color="info"
                        onClick={() => router.push(`/action-plans/view/${plan.id}`)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton 
                        color="primary"
                        onClick={() => router.push(`/action-plans/edit/${plan.id}`)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </DashboardLayout>
  );
};

export default ActionPlansPage;