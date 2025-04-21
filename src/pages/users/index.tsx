// src/pages/users/index.tsx
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  CircularProgress,
  FormHelperText
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Key as KeyIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { firestore } from '../../services/firebase/firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '../../services/firebase/firebaseConfig';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operational' | 'validator' | 'network';
  status: 'active' | 'inactive';
  createdAt: any;
  pharmacies?: string[];
}

interface Pharmacy {
  id: string;
  name: string;
}

interface FormState {
  name: string;
  email: string;
  role: 'admin' | 'operational' | 'validator' | 'network';
  status: 'active' | 'inactive';
  pharmacies: string[];
}

const initialFormState: FormState = {
  name: '',
  email: '',
  role: 'operational',
  status: 'active',
  pharmacies: []
};

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [submitting, setSubmitting] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar farmácias
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
        
        // Buscar usuários
        const usersRef = collection(firestore, 'users');
        let usersQuery = query(usersRef);
        
        // Filtrar por papel
        if (filterRole !== 'all') {
          usersQuery = query(usersQuery, where('role', '==', filterRole));
        }
        
        // Filtrar por status
        if (filterStatus !== 'all') {
          usersQuery = query(usersQuery, where('status', '==', filterStatus));
        }
        
        const usersSnapshot = await getDocs(usersQuery);
        
        const usersList: User[] = [];
        usersSnapshot.forEach((doc) => {
          usersList.push({
            id: doc.id,
            ...doc.data() as Omit<User, 'id'>
          });
        });
        
        setUsers(usersList);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filterRole, filterStatus]);

  const handleFilterChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    if (name === 'role') {
      setFilterRole(value as string);
    } else if (name === 'status') {
      setFilterStatus(value as string);
    }
  };

  const handleOpenDialog = (mode: 'create' | 'edit', user?: User) => {
    setDialogMode(mode);
    setErrors({});
    
    if (mode === 'create') {
      setForm(initialFormState);
      setEditingId(null);
    } else if (user) {
      setForm({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        pharmacies: user.pharmacies || []
      });
      setEditingId(user.id);
    }
    
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleMultiSelectChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setForm(prev => ({
      ...prev,
      pharmacies: event.target.value as string[]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!form.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (!form.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'E-mail inválido';
    }
    
    if (form.role === 'operational' && form.pharmacies.length === 0) {
      newErrors.pharmacies = 'Selecione pelo menos uma farmácia';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      if (dialogMode === 'create') {
        // Criar usuário no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          form.email,
          'ChangeMe123!' // Senha padrão temporária
        );
        
        // Criar documento do usuário no Firestore
        await addDoc(collection(firestore, 'users'), {
          uid: userCredential.user.uid,
          name: form.name,
          email: form.email,
          role: form.role,
          status: form.status,
          pharmacies: form.pharmacies,
          createdAt: new Date()
        });
        
        // Enviar e-mail de redefinição de senha
        await sendPasswordResetEmail(auth, form.email);
        
      } else if (dialogMode === 'edit' && editingId) {
        // Atualizar documento no Firestore
        await updateDoc(doc(firestore, 'users', editingId), {
          name: form.name,
          role: form.role,
          status: form.status,
          pharmacies: form.pharmacies,
          updatedAt: new Date()
        });
      }
      
      // Recarregar lista
      setDialogOpen(false);
      window.location.reload(); // Recarregar para obter dados atualizados (simplificação)
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      setErrors({ submit: 'Erro ao salvar usuário. Verifique se o e-mail já está em uso.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: 'active' | 'inactive') => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      await updateDoc(doc(firestore, 'users', userId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Atualizar lista local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status do usuário');
    }
  };

  const handleOpenResetPassword = (email: string) => {
    setResetPasswordEmail(email);
    setResetPasswordDialog(true);
  };

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, resetPasswordEmail);
      setResetPasswordDialog(false);
      alert('E-mail de redefinição de senha enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar e-mail de redefinição:', error);
      alert('Erro ao enviar e-mail de redefinição de senha');
    }
  };

  const handleOpenDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setConfirmDeleteDialog(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteDoc(doc(firestore, 'users', userToDelete.id));
      
      // Atualizar lista local
      setUsers(prevUsers => 
        prevUsers.filter(user => user.id !== userToDelete.id)
      );
      
      setConfirmDeleteDialog(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário');
    }
  };

  // Filtragem por termo de busca
  const filteredUsers = users.filter(
    user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mapear papéis para exibição
  const roleLabels = {
    admin: 'Administrador',
    operational: 'Operacional',
    validator: 'Validador',
    network: 'Rede'
  };

  // Obter nomes das farmácias
  const getPharmacyNames = (pharmacyIds: string[]) => {
    if (!pharmacyIds || pharmacyIds.length === 0) return '-';
    
    return pharmacyIds
      .map(id => {
        const pharmacy = pharmacies.find(p => p.id === id);
        return pharmacy ? pharmacy.name : 'Desconhecida';
      })
      .join(', ');
  };

  return (
    <DashboardLayout title="Gestão de Usuários">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Usuários
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          Novo Usuário
        </Button>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por nome ou e-mail..."
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
            <InputLabel>Papel</InputLabel>
            <Select
              name="role"
              value={filterRole}
              onChange={handleFilterChange as any}
              label="Papel"
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
              <MenuItem value="operational">Operacional</MenuItem>
              <MenuItem value="validator">Validador</MenuItem>
              <MenuItem value="network">Rede</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={filterStatus}
              onChange={handleFilterChange as any}
              label="Status"
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="active">Ativo</MenuItem>
              <MenuItem value="inactive">Inativo</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>E-mail</TableCell>
                <TableCell>Papel</TableCell>
                <TableCell>Farmácias</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {roleLabels[user.role] || user.role}
                    </TableCell>
                    <TableCell>
                      {getPharmacyNames(user.pharmacies || [])}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.status === 'active' ? 'Ativo' : 'Inativo'} 
                        color={user.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        color="primary"
                        onClick={() => handleOpenDialog('edit', user)}
                        title="Editar"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color={user.status === 'active' ? 'error' : 'success'}
                        onClick={() => handleToggleStatus(user.id, user.status)}
                        title={user.status === 'active' ? 'Desativar' : 'Ativar'}
                      >
                        {user.status === 'active' ? <BlockIcon /> : <CheckCircleIcon />}
                      </IconButton>
                      <IconButton 
                        color="info"
                        onClick={() => handleOpenResetPassword(user.email)}
                        title="Resetar senha"
                      >
                        <KeyIcon />
                      </IconButton>
                      <IconButton 
                        color="error"
                        onClick={() => handleOpenDeleteDialog(user)}
                        title="Excluir"
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
      
      {/* Dialog para criar/editar usuário */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Novo Usuário' : 'Editar Usuário'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="E-mail"
                name="email"
                type="email"
                value={form.email}
                onChange={handleFormChange}
                error={!!errors.email}
                helperText={errors.email}
                required
                disabled={dialogMode === 'edit'} // Não permitir alteração de e-mail
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Papel</InputLabel>
                <Select
                  name="role"
                  value={form.role}
                  onChange={handleFormChange as any}
                  label="Papel"
                  required
                >
                  <MenuItem value="admin">Administrador</MenuItem>
                  <MenuItem value="operational">Operacional</MenuItem>
                  <MenuItem value="validator">Validador</MenuItem>
                  <MenuItem value="network">Rede</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={form.status}
                  onChange={handleFormChange as any}
                  label="Status"
                  required
                >
                  <MenuItem value="active">Ativo</MenuItem>
                  <MenuItem value="inactive">Inativo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.pharmacies}>
                <InputLabel>Farmácias</InputLabel>
                <Select
                  multiple
                  value={form.pharmacies}
                  onChange={handleMultiSelectChange as any}
                  label="Farmácias"
                  disabled={form.role !== 'operational'} // Apenas usuários operacionais tem farmácias
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const pharmacy = pharmacies.find(p => p.id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={pharmacy ? pharmacy.name : value} 
                            size="small" 
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {pharmacies.map((pharmacy) => (
                    <MenuItem key={pharmacy.id} value={pharmacy.id}>
                      {pharmacy.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.pharmacies && (
                  <FormHelperText>{errors.pharmacies}</FormHelperText>
                )}
              </FormControl>
              {form.role === 'operational' && (
                <FormHelperText>
                  Selecione as farmácias que este usuário poderá gerenciar
                </FormHelperText>
              )}
            </Grid>
            
            {dialogMode === 'create' && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mt: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Nota:</strong> Ao criar um novo usuário, um e-mail de redefinição de senha será enviado automaticamente.
                  </Typography>
                  <Typography variant="body2">
                    A senha padrão é "ChangeMe123!" e deverá ser alterada no primeiro acesso.
                  </Typography>
                </Box>
              </Grid>
            )}
            
            {errors.submit && (
              <Grid item xs={12}>
                <FormHelperText error>{errors.submit}</FormHelperText>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog para redefinição de senha */}
      <Dialog open={resetPasswordDialog} onClose={() => setResetPasswordDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Redefinir Senha
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Deseja enviar um e-mail de redefinição de senha para:
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 1 }}>
            {resetPasswordEmail}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Um link será enviado para o e-mail do usuário, permitindo que ele crie uma nova senha.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleResetPassword} 
            variant="contained" 
            color="primary"
          >
            Enviar E-mail
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog para confirmar exclusão */}
      <Dialog open={confirmDeleteDialog} onClose={() => setConfirmDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Tem certeza que deseja excluir o usuário:
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 1 }}>
            {userToDelete?.name}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteUser} 
            variant="contained" 
            color="error"
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};

export default UsersPage;