import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  IconButton, 
  Divider, 
  Chip,
  CircularProgress,
  FormHelperText,
  SelectChangeEvent
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../../services/firebase/firebaseConfig';
import dynamic from 'next/dynamic';

// Import TinyMCE editor dynamically
const Editor = dynamic(() => import('@tinymce/tinymce-react').then(mod => mod.Editor), {
  ssr: false,
  loading: () => <Box sx={{ height: 300, border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando editor...</Box>
});

interface Indicator {
  id: string;
  name: string;
  flowType: 'faturamento' | 'cupom';
  isPrimary: boolean;
}

interface FormState {
  title: string;
  description: string;
  richDescription: string;
  indicatorId: string;
  flowType: 'faturamento' | 'cupom';
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  steps: string[];
  products: string[];
  requiresPhoto: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const initialState: FormState = {
  title: '',
  description: '',
  richDescription: '',
  indicatorId: '',
  flowType: 'faturamento',
  priority: 'medium',
  deadline: '7 dias',
  steps: [''],
  products: [],
  requiresPhoto: true
};

const CreateActionPlanPage: React.FC = () => {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        // Buscar indicadores primários
        const indicatorsRef = collection(firestore, 'indicators');
        const q = query(indicatorsRef, where('isPrimary', '==', true));
        const querySnapshot = await getDocs(q);
        
        const indicatorsList: Indicator[] = [];
        querySnapshot.forEach((doc) => {
          indicatorsList.push({
            id: doc.id,
            ...doc.data() as Omit<Indicator, 'id'>
          });
        });
        
        setIndicators(indicatorsList);
      } catch (error) {
        console.error('Erro ao carregar indicadores:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchIndicators();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Limpar erro
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    
    if (name === 'indicatorId') {
      // Atualizar flowType com base no indicador selecionado
      const indicator = indicators.find(i => i.id === value);
      if (indicator) {
        setForm(prev => ({ 
          ...prev, 
          [name]: value, 
          flowType: indicator.flowType
        }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    
    // Limpar erro
    if (errors[name as string]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as string];
        return newErrors;
      });
    }
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...form.steps];
    newSteps[index] = value;
    setForm(prev => ({ ...prev, steps: newSteps }));
  };

  const addStep = () => {
    setForm(prev => ({ ...prev, steps: [...prev.steps, ''] }));
  };

  const removeStep = (index: number) => {
    const newSteps = [...form.steps];
    newSteps.splice(index, 1);
    setForm(prev => ({ ...prev, steps: newSteps }));
  };

  const handleAddProduct = () => {
    if (newProduct.trim()) {
      setForm(prev => ({ 
        ...prev, 
        products: [...prev.products, newProduct.trim()] 
      }));
      setNewProduct('');
    }
  };

  const removeProduct = (index: number) => {
    const newProducts = [...form.products];
    newProducts.splice(index, 1);
    setForm(prev => ({ ...prev, products: newProducts }));
  };

  const handleEditorChange = (content: string) => {
    setForm(prev => ({ ...prev, richDescription: content }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!form.title.trim()) newErrors.title = 'Título é obrigatório';
    if (!form.description.trim()) newErrors.description = 'Descrição é obrigatória';
    if (!form.indicatorId) newErrors.indicatorId = 'Indicador é obrigatório';
    
    // Validar etapas vazias
    const emptyStepIndex = form.steps.findIndex(step => !step.trim());
    if (emptyStepIndex !== -1) {
      newErrors[`step_${emptyStepIndex}`] = 'Etapa não pode ser vazia';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Filtrar etapas vazias
      const filteredSteps = form.steps.filter(step => step.trim());
      
      // Preparar dados para salvamento
      const planData = {
        ...form,
        steps: filteredSteps,
        createdAt: new Date()
      };
      
      // Adicionar documento
      await addDoc(collection(firestore, 'actionPlans'), planData);
      
      // Redirecionar para lista
      router.push('/action-plans');
    } catch (error) {
      console.error('Erro ao criar plano de ação:', error);
      setErrors({ submit: 'Erro ao criar plano de ação. Tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Criar Plano de Ação">
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Criar Novo Plano de Ação
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Seção: Informações Básicas */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Informações Básicas
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título do Plano de Ação"
                name="title"
                value={form.title}
                onChange={handleChange}
                error={!!errors.title}
                helperText={errors.title}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição Resumida"
                name="description"
                value={form.description}
                onChange={handleChange}
                error={!!errors.description}
                helperText={errors.description}
                multiline
                rows={2}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.indicatorId}>
                <InputLabel>Indicador Relacionado</InputLabel>
                <Select
                  name="indicatorId"
                  value={form.indicatorId}
                  onChange={handleSelectChange}
                  label="Indicador Relacionado"
                  required
                >
                  {indicators.map(indicator => (
                    <MenuItem key={indicator.id} value={indicator.id}>
                      {indicator.name} ({indicator.flowType === 'faturamento' ? 'Faturamento' : 'Cupom'})
                    </MenuItem>
                  ))}
                </Select>
                {errors.indicatorId && (
                  <FormHelperText>{errors.indicatorId}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select
                  name="priority"
                  value={form.priority}
                  onChange={handleSelectChange}
                  label="Prioridade"
                  required
                >
                  <MenuItem value="high">Alta</MenuItem>
                  <MenuItem value="medium">Média</MenuItem>
                  <MenuItem value="low">Baixa</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prazo Sugerido"
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
                placeholder="Ex: 7 dias, 2 semanas, etc."
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Exige Foto de Execução</InputLabel>
                <Select
                  name="requiresPhoto"
                  value={form.requiresPhoto ? 'true' : 'false'}
                  onChange={(e) => {
                    setForm(prev => ({ 
                      ...prev, 
                      requiresPhoto: e.target.value === 'true'
                    }));
                  }}
                  label="Exige Foto de Execução"
                >
                  <MenuItem value="true">Sim</MenuItem>
                  <MenuItem value="false">Não</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Descrição Detalhada com Editor Rico */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Descrição Detalhada
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mt: 2, mb: 3 }}>
                {!isLoading && (
                  <Editor
                    apiKey="YOUR_TINYMCE_API_KEY"
                    value={form.richDescription}
                    init={{
                      height: 300,
                      menubar: false,
                      plugins: [
                        'advlist autolink lists link image charmap print preview anchor',
                        'searchreplace visualblocks code fullscreen',
                        'insertdatetime media table paste code help wordcount'
                      ],
                      toolbar:
                        'undo redo | formatselect | bold italic backcolor | \
                        alignleft aligncenter alignright alignjustify | \
                        bullist numlist outdent indent | removeformat | help'
                    }}
                    onEditorChange={handleEditorChange}
                  />
                )}
              </Box>
            </Grid>
            
            {/* Seção: Etapas */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Etapas para Execução
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            {form.steps.map((step, index) => (
              <Grid item xs={12} key={index}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    label={`Etapa ${index + 1}`}
                    value={step}
                    onChange={(e) => handleStepChange(index, e.target.value)}
                    error={!!errors[`step_${index}`]}
                    helperText={errors[`step_${index}`]}
                    required
                  />
                  <IconButton 
                    color="error" 
                    onClick={() => removeStep(index)}
                    disabled={form.steps.length <= 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Grid>
            ))}
            
            <Grid item xs={12}>
              <Button 
                startIcon={<AddIcon />}
                onClick={addStep}
                variant="outlined"
              >
                Adicionar Etapa
              </Button>
            </Grid>
            
            {/* Seção: Produtos */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Produtos Relacionados (Opcional)
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Nome do Produto"
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  placeholder="Digite o nome do produto e clique em adicionar"
                />
                <Button 
                  onClick={handleAddProduct}
                  variant="contained"
                  disabled={!newProduct.trim()}
                >
                  Adicionar
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {form.products.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Nenhum produto adicionado
                  </Typography>
                ) : (
                  form.products.map((product, index) => (
                    <Chip
                      key={index}
                      label={product}
                      onDelete={() => removeProduct(index)}
                      color="primary"
                      variant="outlined"
                    />
                  ))
                )}
              </Box>
            </Grid>
            
            {/* Botões de ação */}
            <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                onClick={() => router.back()} 
                sx={{ mr: 2 }}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {submitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </Grid>
            
            {/* Mensagem de erro geral */}
            {errors.submit && (
              <Grid item xs={12}>
                <FormHelperText error>{errors.submit}</FormHelperText>
              </Grid>
            )}
          </Grid>
        </form>
      </Paper>
    </DashboardLayout>
  );
};

export default CreateActionPlanPage;