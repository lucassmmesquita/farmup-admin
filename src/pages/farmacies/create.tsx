import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress,
  FormHelperText,
  IconButton,
  SelectChangeEvent
} from '@mui/material';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../../services/firebase/firebaseConfig';
import Image from 'next/image';

interface FormState {
  name: string;
  cnpj: string;
  responsibleName: string;
  email: string;
  phone: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  primaryColor: string;
  secondaryColor: string;
  uvcTarget: string;
  ticketTarget: string;
  priceTarget: string;
  status: 'active' | 'inactive';
}

interface FormErrors {
  [key: string]: string;
}

const initialState: FormState = {
  name: '',
  cnpj: '',
  responsibleName: '',
  email: '',
  phone: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
  primaryColor: '#4B9EFF',
  secondaryColor: '#6C63FF',
  uvcTarget: '2.10',
  ticketTarget: '95.00',
  priceTarget: '45.00',
  status: 'active',
};

const CreatePharmacyPage: React.FC = () => {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Limpar erro do campo quando for alterado
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name as string]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogo(file);
      
      // Criar preview do logo
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Validações básicas
    if (!form.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!form.cnpj.trim()) newErrors.cnpj = 'CNPJ é obrigatório';
    if (!form.responsibleName.trim()) newErrors.responsibleName = 'Nome do responsável é obrigatório';
    if (!form.email.trim()) newErrors.email = 'E-mail é obrigatório';
    
    // Validar CNPJ (formato básico)
    if (form.cnpj && !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(form.cnpj)) {
      newErrors.cnpj = 'CNPJ inválido (formato: XX.XXX.XXX/XXXX-XX)';
    }
    
    // Validar email
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'E-mail inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Preparar dados da farmácia
      const pharmacyData = {
        ...form,
        uvcTarget: parseFloat(form.uvcTarget),
        ticketTarget: parseFloat(form.ticketTarget),
        priceTarget: parseFloat(form.priceTarget),
        createdAt: new Date(),
      };
      
      // Adicionar documento à coleção
      const docRef = await addDoc(collection(firestore, 'pharmacies'), pharmacyData);
      
      // Se houver logo, fazer upload
      if (logo) {
        const logoRef = ref(storage, `pharmacies/${docRef.id}/logo`);
        await uploadBytes(logoRef, logo);
        // const logoUrl = await getDownloadURL(logoRef);
        
        // Ao invés de usar updateDoc, você pode adicionar um campo logoUrl quando criar a farmácia
        // Isso evita uma segunda chamada ao banco de dados
      }
      
      // Redirecionar para lista de farmácias
      router.push('/farmacies');
    } catch (error) {
      console.error('Erro ao criar farmácia:', error);
      setErrors({ submit: 'Erro ao criar farmácia. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Cadastrar Nova Farmácia">
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Cadastrar Nova Farmácia
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
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome da Farmácia"
                name="name"
                value={form.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CNPJ"
                name="cnpj"
                value={form.cnpj}
                onChange={handleChange}
                error={!!errors.cnpj}
                helperText={errors.cnpj}
                placeholder="XX.XXX.XXX/XXXX-XX"
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome do Responsável"
                name="responsibleName"
                value={form.responsibleName}
                onChange={handleChange}
                error={!!errors.responsibleName}
                helperText={errors.responsibleName}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="E-mail"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={form.status}
                  onChange={handleSelectChange}
                  label="Status"
                >
                  <MenuItem value="active">Ativo</MenuItem>
                  <MenuItem value="inactive">Inativo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Seção: Endereço */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Endereço
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Rua"
                name="street"
                value={form.street}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Número"
                name="number"
                value={form.number}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Complemento"
                name="complement"
                value={form.complement}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Bairro"
                name="neighborhood"
                value={form.neighborhood}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="CEP"
                name="zipCode"
                value={form.zipCode}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cidade"
                name="city"
                value={form.city}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  name="state"
                  value={form.state}
                  onChange={handleSelectChange}
                  label="Estado"
                >
                  {/* Estados brasileiros */}
                  <MenuItem value="AC">Acre</MenuItem>
                  <MenuItem value="AL">Alagoas</MenuItem>
                  <MenuItem value="AP">Amapá</MenuItem>
                  <MenuItem value="AM">Amazonas</MenuItem>
                  <MenuItem value="BA">Bahia</MenuItem>
                  <MenuItem value="CE">Ceará</MenuItem>
                  <MenuItem value="DF">Distrito Federal</MenuItem>
                  <MenuItem value="ES">Espírito Santo</MenuItem>
                  <MenuItem value="GO">Goiás</MenuItem>
                  <MenuItem value="MA">Maranhão</MenuItem>
                  <MenuItem value="MT">Mato Grosso</MenuItem>
                  <MenuItem value="MS">Mato Grosso do Sul</MenuItem>
                  <MenuItem value="MG">Minas Gerais</MenuItem>
                  <MenuItem value="PA">Pará</MenuItem>
                  <MenuItem value="PB">Paraíba</MenuItem>
                  <MenuItem value="PR">Paraná</MenuItem>
                  <MenuItem value="PE">Pernambuco</MenuItem>
                  <MenuItem value="PI">Piauí</MenuItem>
                  <MenuItem value="RJ">Rio de Janeiro</MenuItem>
                  <MenuItem value="RN">Rio Grande do Norte</MenuItem>
                  <MenuItem value="RS">Rio Grande do Sul</MenuItem>
                  <MenuItem value="RO">Rondônia</MenuItem>
                  <MenuItem value="RR">Roraima</MenuItem>
                  <MenuItem value="SC">Santa Catarina</MenuItem>
                  <MenuItem value="SP">São Paulo</MenuItem>
                  <MenuItem value="SE">Sergipe</MenuItem>
                  <MenuItem value="TO">Tocantins</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Seção: Personalização (White Label) */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Personalização (White Label)
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Logo
                </Typography>
                
                {logoPreview && (
                  <Box 
                    sx={{ 
                      width: 200, 
                      height: 80, 
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #ccc',
                      borderRadius: 1,
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <Box position="relative" width={200} height={80}>
                      <Image 
                        src={logoPreview} 
                        alt="Preview" 
                        layout="fill"
                        objectFit="contain"
                      />
                    </Box>
                  </Box>
                )}
                
                <Button
                  variant="contained"
                  component="label"
                  sx={{ width: 200 }}
                >
                  Selecionar Logo
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleLogoChange}
                  />
                </Button>
                <FormHelperText>
                  Tamanho recomendado: 200x80px
                </FormHelperText>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Cor Primária"
                    name="primaryColor"
                    value={form.primaryColor}
                    onChange={handleChange}
                    type="color"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Cor Secundária"
                    name="secondaryColor"
                    value={form.secondaryColor}
                    onChange={handleChange}
                    type="color"
                  />
                </Grid>
              </Grid>
            </Grid>
            
            {/* Seção: Metas Padrão */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Metas Padrão
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Meta de UVC"
                name="uvcTarget"
                value={form.uvcTarget}
                onChange={handleChange}
                type="number"
                inputProps={{ step: "0.01" }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Meta de Ticket Médio (R$)"
                name="ticketTarget"
                value={form.ticketTarget}
                onChange={handleChange}
                type="number"
                inputProps={{ step: "0.01" }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Meta de Preço Médio (R$)"
                name="priceTarget"
                value={form.priceTarget}
                onChange={handleChange}
                type="number"
                inputProps={{ step: "0.01" }}
              />
            </Grid>
            
            {/* Botões de ação */}
            <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                onClick={() => router.back()} 
                sx={{ mr: 2 }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </Grid>
          </Grid>
          
          {/* Mensagem de erro geral */}
          {errors.submit && (
            <Box sx={{ mt: 2 }}>
              <FormHelperText error>{errors.submit}</FormHelperText>
            </Box>
          )}
        </form>
      </Paper>
    </DashboardLayout>
  );
};

export default CreatePharmacyPage;