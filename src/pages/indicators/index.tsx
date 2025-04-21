// src/pages/indicators/index.tsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Tabs, 
  Tab, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../services/firebase/firebaseConfig';
import { useRouter } from 'next/router';

interface Indicator {
  id: string;
  name: string;
  description: string;
  isPrimary: boolean;
  icon: string;
  flowType: 'faturamento' | 'cupom';
  parentId?: string;
}

const IndicatorsPage: React.FC = () => {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState<'faturamento' | 'cupom'>('faturamento');
  const router = useRouter();

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const indicatorsRef = collection(firestore, 'indicators');
        const querySnapshot = await getDocs(indicatorsRef);
        
        const indicatorList: Indicator[] = [];
        querySnapshot.forEach((doc) => {
          indicatorList.push({
            id: doc.id,
            ...doc.data() as Omit<Indicator, 'id'>
          });
        });
        
        setIndicators(indicatorList);
      } catch (error) {
        console.error('Erro ao carregar indicadores:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchIndicators();
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: 'faturamento' | 'cupom') => {
    setTabValue(newValue);
  };

  const filteredIndicators = indicators.filter(
    (indicator) => 
      indicator.flowType === tabValue &&
      indicator.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para obter o nome do indicador pai
  const getParentName = (parentId?: string) => {
    if (!parentId) return '-';
    const parent = indicators.find(i => i.id === parentId);
    return parent ? parent.name : '-';
  };

  return (
    <DashboardLayout title="Gestão de Indicadores">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Indicadores
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => router.push('/indicators/create')}
        >
          Novo Indicador
        </Button>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Faturamento" value="faturamento" />
          <Tab label="Cupom" value="cupom" />
        </Tabs>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Indicador Pai</TableCell>
                <TableCell>Descrição</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Carregando...</TableCell>
                </TableRow>
              ) : filteredIndicators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Nenhum indicador encontrado</TableCell>
                </TableRow>
              ) : (
                filteredIndicators.map((indicator) => (
                  <TableRow key={indicator.id} hover>
                    <TableCell>{indicator.name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={indicator.isPrimary ? 'Primário' : 'Derivado'} 
                        color={indicator.isPrimary ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{getParentName(indicator.parentId)}</TableCell>
                    <TableCell>{indicator.description.substring(0, 50)}...</TableCell>
                    <TableCell align="right">
                      <IconButton 
                        color="info"
                        onClick={() => router.push(`/indicators/view/${indicator.id}`)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton 
                        color="primary"
                        onClick={() => router.push(`/indicators/edit/${indicator.id}`)}
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
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Visualização do Grafo
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => router.push('/indicators/graph')}
        >
          Visualizar Grafo
        </Button>
      </Box>
    </DashboardLayout>
  );
};

export default IndicatorsPage;