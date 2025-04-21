// src/pages/indicators/relations.tsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Tabs, 
  Tab,
  IconButton,
  Table,
  TableBody,
  TableCell, 
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  TextField,
  CircularProgress
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { firestore } from '../../services/firebase/firebaseConfig';

interface Indicator {
  id: string;
  name: string;
  flowType: 'faturamento' | 'cupom';
}

interface Relation {
  id: string;
  sourceId: string;
  targetId: string;
  impact: number;
  flowType: 'faturamento' | 'cupom';
  description?: string;
}

interface FormState {
  sourceId: string;
  targetId: string;
  impact: number;
  description: string;
}

const initialFormState: FormState = {
  sourceId: '',
  targetId: '',
  impact: 0.5,
  description: ''
};

const IndicatorRelationsPage: React.FC = () => {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);
  const [flowType, setFlowType] = useState<'faturamento' | 'cupom'>('faturamento');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [form, setForm] = useState<FormState>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, [flowType]);

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
      
      // Buscar relações
      const relationsRef = collection(firestore, 'relations');
      const relationsSnapshot = await getDocs(relationsRef);
      
      const relationsList: Relation[] = [];
      relationsSnapshot.forEach((doc) => {
        relationsList.push({
          id: doc.id,
          ...doc.data() as Omit<Relation, 'id'>
        });
      });
      
      setRelations(relationsList);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlowTypeChange = (_: React.SyntheticEvent, newValue: 'faturamento' | 'cupom') => {
    setFlowType(newValue);
  };

  const handleOpenDialog = (mode: 'create' | 'edit', relation?: Relation) => {
    setDialogMode(mode);
    
    if (mode === 'edit' && relation) {
      setForm({
        sourceId: relation.sourceId,
        targetId: relation.targetId,
        impact: relation.impact,
        description: relation.description || ''
      });
      setEditingId(relation.id);
    } else {
      setForm(initialFormState);
      setEditingId(null);
    }
    
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setForm(initialFormState);
    setEditingId(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImpactChange = (_: Event, value: number | number[]) => {
    setForm(prev => ({ ...prev, impact: value as number }));
  };

  const handleSubmit = async () => {
    if (!form.sourceId || !form.targetId) {
      // Mostrar erro
      return;
    }
    
    // Evitar relação reflexiva
    if (form.sourceId === form.targetId) {
      // Mostrar erro
      return;
    }
    
    setSubmitting(true);
    
    try {
      if (dialogMode === 'create') {
        // Criar nova relação
        await addDoc(collection(firestore, 'relations'), {
          ...form,
          flowType,
          impact: parseFloat(form.impact.toString())
        });
      } else if (dialogMode === 'edit' && editingId) {
        // Atualizar relação existente
        const relationRef = doc(firestore, 'relations', editingId);
        await updateDoc(relationRef, {
          ...form,
          impact: parseFloat(form.impact.toString())
        });
      }
      
      // Recarregar dados
      await fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar relação:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (relationId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta relação?')) {
      try {
        await deleteDoc(doc(firestore, 'relations', relationId));
        await fetchData();
      } catch (error) {
        console.error('Erro ao excluir relação:', error);
      }
    }
  };

  // Filtrar relações pelo tipo de fluxo selecionado
  const filteredRelations = relations.filter(r => r.flowType === flowType);

  // Obter nome do indicador pelo ID
  const getIndicatorName = (id: string) => {
    const indicator = indicators.find(i => i.id === id);
    return indicator ? indicator.name : 'Desconhecido';
  };

  return (
    <DashboardLayout title="Gerenciamento de Relações entre Indicadores">
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Relações entre Indicadores
        </Typography>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={flowType} onChange={handleFlowTypeChange}>
          <Tab label="Faturamento" value="faturamento" />
          <Tab label="Cupom" value="cupom" />
        </Tabs>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('create')}
          >
            Nova Relação
          </Button>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Indicador Fonte</TableCell>
                <TableCell>Indicador Alvo</TableCell>
                <TableCell>Impacto</TableCell>
                <TableCell>Descrição</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : filteredRelations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Nenhuma relação cadastrada para este fluxo
                  </TableCell>
                </TableRow>
              ) : (
                filteredRelations.map(relation => (
                  <TableRow key={relation.id} hover>
                    <TableCell>{getIndicatorName(relation.sourceId)}</TableCell>
                    <TableCell>{getIndicatorName(relation.targetId)}</TableCell>
                    <TableCell>{(relation.impact * 100).toFixed()}%</TableCell>
                    <TableCell>{relation.description || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton 
                        color="primary"
                        onClick={() => handleOpenDialog('edit', relation)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="error"
                        onClick={() => handleDelete(relation.id)}
                      >
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
      
      {/* Dialog para criar/editar relação */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Nova Relação' : 'Editar Relação'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Indicador Fonte</InputLabel>
              <Select
                name="sourceId"
                value={form.sourceId}
                onChange={handleFormChange as any}
                label="Indicador Fonte"
              >
                {indicators
                  .filter(i => i.flowType === flowType)
                  .map(indicator => (
                    <MenuItem key={indicator.id} value={indicator.id}>
                      {indicator.name}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Indicador Alvo</InputLabel>
              <Select
                name="targetId"
                value={form.targetId}
                onChange={handleFormChange as any}
                label="Indicador Alvo"
              >
                {indicators
                  .filter(i => i.flowType === flowType && i.id !== form.sourceId)
                  .map(indicator => (
                    <MenuItem key={indicator.id} value={indicator.id}>
                      {indicator.name}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
            
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                Impacto: {(form.impact * 100).toFixed()}%
              </Typography>
              <Slider
                value={form.impact}
                onChange={handleImpactChange}
                min={0.1}
                max={1}
                step={0.05}
                marks={[
                  { value: 0.1, label: '10%' },
                  { value: 0.5, label: '50%' },
                  { value: 1, label: '100%' },
                ]}
              />
            </Box>
            
            <TextField
              fullWidth
              label="Descrição da Relação"
              name="description"
              value={form.description}
              onChange={handleFormChange}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={!form.sourceId || !form.targetId || submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};

export default IndicatorRelationsPage;