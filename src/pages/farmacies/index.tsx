// src/pages/farmacies/index.tsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Typography, 
  Paper, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Box,
  Chip,
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { firestore } from '../../services/firebase/firebaseConfig';
import { useRouter } from 'next/router';

interface Pharmacy {
  id: string;
  name: string;
  cnpj: string;
  city: string;
  state: string;
  status: 'active' | 'inactive';
  primaryColor: string;
}

const PharmaciesPage: React.FC = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        const pharmaciesRef = collection(firestore, 'pharmacies');
        const q = query(pharmaciesRef, orderBy('name'));
        const querySnapshot = await getDocs(q);
        
        const pharmacyList: Pharmacy[] = [];
        querySnapshot.forEach((doc) => {
          pharmacyList.push({
            id: doc.id,
            ...doc.data() as Omit<Pharmacy, 'id'>
          });
        });
        
        setPharmacies(pharmacyList);
      } catch (error) {
        console.error('Erro ao carregar farmácias:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPharmacies();
  }, []);

  const filteredPharmacies = pharmacies.filter(
    (pharmacy) => 
      pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.cnpj.includes(searchTerm) ||
      pharmacy.city.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <DashboardLayout title="Gestão de Farmácias">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Farmácias
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => router.push('/farmacies/create')}
        >
          Nova Farmácia
        </Button>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nome, CNPJ ou cidade..."
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
                <TableCell>CNPJ</TableCell>
                <TableCell>Cidade/UF</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Cor</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Carregando...</TableCell>
                </TableRow>
              ) : filteredPharmacies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Nenhuma farmácia encontrada</TableCell>
                </TableRow>
              ) : (
                filteredPharmacies.map((pharmacy) => (
                  <TableRow key={pharmacy.id} hover>
                    <TableCell>{pharmacy.name}</TableCell>
                    <TableCell>{pharmacy.cnpj}</TableCell>
                    <TableCell>{`${pharmacy.city}/${pharmacy.state}`}</TableCell>
                    <TableCell>
                      <Chip 
                        label={pharmacy.status === 'active' ? 'Ativo' : 'Inativo'} 
                        color={pharmacy.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: '50%', 
                          bgcolor: pharmacy.primaryColor,
                          border: '1px solid #ccc'  
                        }} 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        color="primary"
                        onClick={() => router.push(`/farmacies/edit/${pharmacy.id}`)}
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

export default PharmaciesPage;