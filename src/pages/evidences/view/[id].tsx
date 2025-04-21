// src/pages/evidences/view/[id].tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Chip, 
  IconButton, 
  Divider, 
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Map as MapIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Store as StoreIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../../services/firebase/firebaseConfig';

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
  reviewedAt?: any;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  feedback?: string;
}

const EvidenceView: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    const fetchEvidence = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        const evidenceRef = doc(firestore, 'evidences', id as string);
        const evidenceDoc = await getDoc(evidenceRef);
        
        if (evidenceDoc.exists()) {
          setEvidence({
            id: evidenceDoc.id,
            ...evidenceDoc.data() as Omit<Evidence, 'id'>
          });
        } else {
          alert('Evidência não encontrada');
          router.back();
        }
      } catch (error) {
        console.error('Erro ao carregar evidência:', error);
        alert('Erro ao carregar evidência');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvidence();
  }, [id, router]);

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

  const openApproveDialog = () => {
    setActionType('approve');
    setFeedback('');
    setFeedbackDialog(true);
  };

  const openRejectDialog = () => {
    setActionType('reject');
    setFeedback('');
    setFeedbackDialog(true);
  };

  const handleCloseDialog = () => {
    setFeedbackDialog(false);
  };

  const handleSubmitFeedback = async () => {
    if (actionType === 'reject' && !feedback.trim()) {
      alert('É necessário fornecer um motivo para a rejeição');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const status = actionType === 'approve' ? 'approved' : 'rejected';
      
      const evidenceRef = doc(firestore, 'evidences', id as string);
      await updateDoc(evidenceRef, {
        status,
        feedback: feedback.trim() || '',
        reviewedAt: new Date()
      });
      
      // Atualizar estado local
      setEvidence(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          status,
          feedback: feedback.trim() || '',
          reviewedAt: new Date()
        };
      });
      
      setFeedbackDialog(false);
      
      // Notificação
      alert(actionType === 'approve' ? 'Evidência aprovada com sucesso!' : 'Evidência rejeitada com sucesso!');
    } catch (error) {
      console.error('Erro ao processar evidência:', error);
      alert('Erro ao processar evidência');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenMap = () => {
    if (!evidence?.location) return;
    
    const { latitude, longitude } = evidence.location;
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
  };

  // Status
  const statusColors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error'
  };

  const statusLabels = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado'
  };

  if (loading) {
    return (
      <DashboardLayout title="Detalhes da Evidência">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (!evidence) {
    return (
      <DashboardLayout title="Detalhes da Evidência">
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Evidência não encontrada
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Detalhes da Evidência">
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Detalhes da Evidência
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative' }}>
              <Box
                component="img"
                src={evidence.photo}
                alt="Foto da evidência"
                sx={{
                  width: '100%',
                  borderRadius: 1,
                  maxHeight: 500,
                  objectFit: 'contain',
                  border: '1px solid #eee'
                }}
              />
              <Chip 
                label={statusLabels[evidence.status]} 
                color={statusColors[evidence.status] as any}
                sx={{ 
                  position: 'absolute', 
                  top: 16, 
                  right: 16,
                  fontWeight: 'bold'
                }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              {evidence.actionPlanTitle}
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <StoreIcon sx={{ mr: 1, fontSize: 20 }} />
                  <strong>Farmácia:</strong> {evidence.pharmacyName}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                  <strong>Enviado por:</strong> {evidence.userName}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <CalendarIcon sx={{ mr: 1, fontSize: 20 }} />
                  <strong>Data de envio:</strong> {formatDate(evidence.submittedAt)}
                </Box>
                
                {evidence.reviewedAt && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <CalendarIcon sx={{ mr: 1, fontSize: 20 }} />
                    <strong>Data da revisão:</strong> {formatDate(evidence.reviewedAt)}
                  </Box>
                )}
                
                {evidence.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <LocationIcon sx={{ mr: 1, fontSize: 20 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <strong>Localização:</strong>
                      <span>{evidence.location.address || 'Local não identificado'}</span>
                      <Button
                        size="small"
                        startIcon={<MapIcon />}
                        onClick={handleOpenMap}
                        sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                      >
                        Ver no mapa
                      </Button>
                    </Box>
                  </Box>
                )}
              </Typography>
            </Box>
            
            {evidence.feedback && (
              <Box sx={{ mt: 2, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <DescriptionIcon sx={{ mr: 1, fontSize: 20, verticalAlign: 'middle' }} />
                  Feedback:
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="body2">
                    {evidence.feedback}
                  </Typography>
                </Paper>
              </Box>
            )}
            
            {evidence.status === 'pending' && (
              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button 
                  variant="contained" 
                  color="success"
                  startIcon={<ApproveIcon />}
                  onClick={openApproveDialog}
                  fullWidth
                >
                  Aprovar
                </Button>
                <Button 
                  variant="contained" 
                  color="error"
                  startIcon={<RejectIcon />}
                  onClick={openRejectDialog}
                  fullWidth
                >
                  Rejeitar
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      {/* Dialog para Feedback */}
      <Dialog open={feedbackDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Aprovar Evidência' : 'Rejeitar Evidência'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label={actionType === 'approve' ? 'Feedback (opcional)' : 'Motivo da rejeição'}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              multiline
              rows={4}
              required={actionType === 'reject'}
              error={actionType === 'reject' && !feedback.trim()}
              helperText={actionType === 'reject' && !feedback.trim() ? 'É necessário informar o motivo da rejeição' : ''}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmitFeedback} 
            variant="contained" 
            color={actionType === 'approve' ? 'success' : 'error'}
            disabled={actionType === 'reject' && !feedback.trim() || submitting}
          >
            {submitting ? <CircularProgress size={24} /> : actionType === 'approve' ? 'Aprovar' : 'Rejeitar'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};

export default EvidenceView;