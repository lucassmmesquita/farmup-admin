// src/pages/evidences/index.tsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Box, 
  Typography, 
  Paper, 
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
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  doc 
} from 'firebase/firestore';
import { firestore } from '../../services/firebase/firebaseConfig';

interface Evidence {
  id: string;
  actionPlanId: string;
  actionPlanTitle: string;
  pharmacyId: string;
  pharmacyName: string;
  userId: string;
  userName: string;
  photo: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: any;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  feedback?: string;
}

interface Pharmacy {
  id: string;
  name: string;
}

const EvidencesPage: React.FC = () => {
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPharmacy, setFilterPharmacy] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
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
        
        // Buscar evidências
        const evidencesRef = collection(firestore, 'evidences');
        let evidencesQuery = query(evidencesRef, orderBy('submittedAt', 'desc'));
        
        // Filtrar por status
        if (status !== 'all') {
          evidencesQuery = query(evidencesQuery, where('status', '==', status));
        }
        
        // Filtrar por farmácia
        if (filterPharmacy !== 'all') {
          evidencesQuery = query(evidencesQuery, where('pharmacyId', '==', filterPharmacy));
        }
        
        const evidencesSnapshot = await getDocs(evidencesQuery);
        
        const evidencesList: Evidence[] = [];
        evidencesSnapshot.forEach((doc) => {
          evidencesList.push({
            id: doc.id,
            ...doc.data() as Omit<Evidence, 'id'>
          });
        });
        
        setEvidences(evidencesList);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [status, filterPharmacy]);

  const handleStatusChange = (_: React.SyntheticEvent, newValue: 'pending' | 'approved' | 'rejected' | 'all') => {
    setStatus(newValue);
  };

  const handleFilterChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { value } = event.target;
    setFilterPharmacy(value as string);
  };

  const handleApprove = async (evidenceId: string) => {
    try {
      const feedback = prompt('Feedback opcional:');
      
      const evidenceRef = doc(firestore, 'evidences', evidenceId);
      await updateDoc(evidenceRef, {
        status: 'approved',
        feedback: feedback || '',
        reviewedAt: new Date()
      });
      
      // Atualizar estado local
      setEvidences(prevEvidences => 
        prevEvidences.map(evidence => 
          evidence.id === evidenceId 
            ? { ...evidence, status: 'approved', feedback } 
            : evidence
        )
      );
    } catch (error) {
      console.error('Erro ao aprovar evidência:', error);
      alert('Erro ao aprovar evidência');
    }
  };

  const handleReject = async (evidenceId: string) => {
    try {
      const feedback = prompt('Motivo da rejeição (obrigatório):');
      
      if (!feedback) {
        alert('É necessário fornecer um motivo para a rejeição');
        return;
      }
      
      const evidenceRef = doc(firestore, 'evidences', evidenceId);
      await updateDoc(evidenceRef, {
        status: 'rejected',
        feedback,
        reviewedAt: new Date()
      });
      
      // Atualizar estado local
      setEvidences(prevEvidences => 
        prevEvidences.map(evidence => 
          evidence.id === evidenceId 
            ? { ...evidence, status: 'rejected', feedback } 
            : evidence
        )
      );
    } catch (error) {
      console.error('Erro ao rejeitar evidência:', error);
      alert('Erro ao rejeitar evidência');
    }
  };

  // Filtragem por termo de busca
  const filteredEvidences = evidences.filter(
    evidence => 
      evidence.actionPlanTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evidence.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evidence.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Formatação de data
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '-';
    }
  };

  // Cores de status
  const statusColors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error'
  };

  // Textos de status
  const statusLabels = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado'
  };

  return (
    <DashboardLayout title="Validação de Evidências">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Evidências
        </Typography>
        <Box>
          <IconButton 
            color={viewMode === 'list' ? 'primary' : 'default'} 
            onClick={() => setViewMode('list')}
          >
            <FilterIcon />
          </IconButton>
          <IconButton 
            color={viewMode === 'grid' ? 'primary' : 'default'} 
            onClick={() => setViewMode('grid')}
          >
            <VisibilityIcon />
          </IconButton>
        </Box>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={status} onChange={handleStatusChange}>
          <Tab label="Pendentes" value="pending" />
          <Tab label="Aprovados" value="approved" />
          <Tab label="Rejeitados" value="rejected" />
          <Tab label="Todos" value="all" />
        </Tabs>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por plano, farmácia ou usuário..."
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
            <InputLabel>Farmácia</InputLabel>
            <Select
              value={filterPharmacy}
              onChange={handleFilterChange as any}
              label="Farmácia"
            >
              <MenuItem value="all">Todas</MenuItem>
              {pharmacies.map(pharmacy => (
                <MenuItem key={pharmacy.id} value={pharmacy.id}>
                  {pharmacy.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {viewMode === 'list' ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Plano de Ação</TableCell>
                  <TableCell>Farmácia</TableCell>
                  <TableCell>Responsável</TableCell>
                  <TableCell>Data de Envio</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Carregando...</TableCell>
                  </TableRow>
                ) : filteredEvidences.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Nenhuma evidência encontrada</TableCell>
                  </TableRow>
                ) : (
                  filteredEvidences.map((evidence) => (
                    <TableRow key={evidence.id} hover>
                      <TableCell>{evidence.actionPlanTitle}</TableCell>
                      <TableCell>{evidence.pharmacyName}</TableCell>
                      <TableCell>{evidence.userName}</TableCell>
                      <TableCell>{formatDate(evidence.submittedAt)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={statusLabels[evidence.status]} 
                          color={statusColors[evidence.status] as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          color="info"
                          onClick={() => router.push(`/evidences/view/${evidence.id}`)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        {evidence.status === 'pending' && (
                          <>
                            <IconButton 
                              color="success"
                              onClick={() => handleApprove(evidence.id)}
                            >
                              <ApproveIcon />
                            </IconButton>
                            <IconButton 
                              color="error"
                              onClick={() => handleReject(evidence.id)}
                            >
                              <RejectIcon />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Grid container spacing={3}>
            {loading ? (
              <Grid item xs={12} sx={{ textAlign: 'center', py: 4 }}>
                Carregando...
              </Grid>
            ) : filteredEvidences.length === 0 ? (
              <Grid item xs={12} sx={{ textAlign: 'center', py: 4 }}>
                Nenhuma evidência encontrada
              </Grid>
            ) : (
              filteredEvidences.map((evidence) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={evidence.id}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="180"
                      image={evidence.photo}
                      alt="Evidência de execução"
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent>
                      <Typography variant="h6" noWrap title={evidence.actionPlanTitle}>
                        {evidence.actionPlanTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {evidence.pharmacyName}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="caption">
                          {formatDate(evidence.submittedAt)}
                        </Typography>
                        <Chip 
                          label={statusLabels[evidence.status]} 
                          color={statusColors[evidence.status] as any}
                          size="small"
                        />
                      </Box>
                      {evidence.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <LocationIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {evidence.location.address || 'Localização registrada'}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        startIcon={<VisibilityIcon />}
                        onClick={() => router.push(`/evidences/view/${evidence.id}`)}
                      >
                        Detalhes
                      </Button>
                      {evidence.status === 'pending' && (
                        <>
                          <Button 
                            size="small" 
                            color="success"
                            startIcon={<ApproveIcon />}
                            onClick={() => handleApprove(evidence.id)}
                          >
                            Aprovar
                          </Button>
                          <Button 
                            size="small" 
                            color="error"
                            startIcon={<RejectIcon />}
                            onClick={() => handleReject(evidence.id)}
                          >
                            Rejeitar
                          </Button>
                        </>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}
      </Paper>
    </DashboardLayout>
  );
};

export default EvidencesPage;