// src/pages/indicators/graph.tsx
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip,
  Chip
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../services/firebase/firebaseConfig';

// Importação dinâmica do ForceGraph para evitar erros de SSR
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface Indicator {
  id: string;
  name: string;
  isPrimary: boolean;
  flowType: 'faturamento' | 'cupom';
  status?: 'above' | 'below' | 'neutral';
  parentId?: string;
  icon?: string;
  description?: string;
  value?: number | string;
  target?: number | string;
}

interface Relation {
  id: string;
  sourceId: string;
  targetId: string;
  impact: number;
  flowType: 'faturamento' | 'cupom';
  description?: string;
}

interface GraphNode {
  id: string;
  name: string;
  isPrimary: boolean;
  color: string;
  size: number;
  val: number;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
  color: string;
}

const IndicatorGraphPage: React.FC = () => {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);
  const [flowType, setFlowType] = useState<'faturamento' | 'cupom'>('faturamento');
  const [centralNode, setCentralNode] = useState<string>('');
  const [graphReady, setGraphReady] = useState(false);
  const [nodeLabelVisible, setNodeLabelVisible] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Indicator | null>(null);
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
        
        // Definir nó central inicial (raiz)
        const rootNode = indicatorsList.find(
          i => i.flowType === flowType && !i.parentId
        );
        if (rootNode) {
          setCentralNode(rootNode.id);
        }
        
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
        setGraphReady(true);
      } catch (error) {
        console.error('Erro ao carregar dados do grafo:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [flowType]);

  useEffect(() => {
    // Atualizar nó selecionado quando o nó central mudar
    if (centralNode) {
      const node = indicators.find(i => i.id === centralNode);
      if (node) {
        setSelectedNode(node);
      }
    }
  }, [centralNode, indicators]);

  const handleFlowTypeChange = (_: React.SyntheticEvent, newValue: 'faturamento' | 'cupom') => {
    setFlowType(newValue);
    setSelectedNode(null);
  };

  const handleCentralNodeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setCentralNode(event.target.value as string);
  };

  const handleNodeClick = (node: GraphNode) => {
    setCentralNode(node.id);
    const selectedInd = indicators.find(i => i.id === node.id);
    if (selectedInd) {
      setSelectedNode(selectedInd);
    }
  };

  const handleViewIndicator = () => {
    if (selectedNode) {
      router.push(`/indicators/view/${selectedNode.id}`);
    }
  };

  const toggleNodeLabels = () => {
    setNodeLabelVisible(!nodeLabelVisible);
  };

  // Preparar dados para o grafo
  const graphData = React.useMemo(() => {
    if (indicators.length === 0 || relations.length === 0 || !centralNode) {
      return { nodes: [], links: [] };
    }
    
    // Filtrar por tipo de fluxo
    const flowIndicators = indicators.filter(i => i.flowType === flowType);
    const flowRelations = relations.filter(r => r.flowType === flowType);
    
    // Obter nós relacionados (até 2 níveis de profundidade)
    const relatedNodeIds = new Set<string>();
    relatedNodeIds.add(centralNode);
    
    // Nível 1 (diretos)
    flowRelations.forEach(rel => {
      if (rel.sourceId === centralNode) relatedNodeIds.add(rel.targetId);
      if (rel.targetId === centralNode) relatedNodeIds.add(rel.sourceId);
    });
    
    // Nível 2 (indiretos)
    const firstLevelIds = Array.from(relatedNodeIds);
    firstLevelIds.forEach(id => {
      if (id !== centralNode) {
        flowRelations.forEach(rel => {
          if (rel.sourceId === id) relatedNodeIds.add(rel.targetId);
          if (rel.targetId === id) relatedNodeIds.add(rel.sourceId);
        });
      }
    });
    
    // Criar nós do grafo
    const nodes: GraphNode[] = Array.from(relatedNodeIds)
      .map(id => {
        const indicator = flowIndicators.find(i => i.id === id);
        if (!indicator) return null;
        
        let color = '#6C63FF'; // Cor padrão
        let size = 5; // Tamanho padrão
        
        if (id === centralNode) {
          color = '#F57C00'; // Nó central (laranja)
          size = 8;
        } else if (indicator.isPrimary) {
          color = '#4CAF50'; // Indicador primário (verde)
          size = 7;
        } else if (indicator.status === 'below') {
          color = '#F44336'; // Abaixo da meta (vermelho)
          size = 6;
        } else if (indicator.status === 'above') {
          color = '#2196F3'; // Acima da meta (azul)
          size = 6;
        }
        
        return {
          id,
          name: indicator.name,
          isPrimary: indicator.isPrimary,
          color,
          size,
          val: size // Usado para o tamanho do nó
        };
      })
      .filter(Boolean) as GraphNode[];
    
    // Criar links do grafo
    const links: GraphLink[] = flowRelations
      .filter(rel => 
        relatedNodeIds.has(rel.sourceId) && 
        relatedNodeIds.has(rel.targetId)
      )
      .map(rel => ({
        source: rel.sourceId,
        target: rel.targetId,
        value: rel.impact,
        color: '#999999'
      }));
    
    return { nodes, links };
  }, [indicators, relations, centralNode, flowType]);

  return (
    <DashboardLayout title="Visualização do Grafo de Indicadores">
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Grafo de Indicadores
        </Typography>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={flowType} onChange={handleFlowTypeChange}>
          <Tab label="Faturamento" value="faturamento" />
          <Tab label="Cupom" value="cupom" />
        </Tabs>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <FormControl sx={{ width: 300 }}>
            <InputLabel>Nó Central</InputLabel>
            <Select
              value={centralNode}
              onChange={handleCentralNodeChange as any}
              label="Nó Central"
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
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined"
              onClick={toggleNodeLabels}
            >
              {nodeLabelVisible ? 'Ocultar Labels' : 'Mostrar Labels'}
            </Button>
            
            <Button 
              variant="outlined"
              onClick={() => router.push('/indicators/relations')}
            >
              Gerenciar Relações
            </Button>
          </Box>
          
          {selectedNode && (
            <Chip 
              label={`Selecionado: ${selectedNode.name}`}
              color="primary"
              onDelete={() => setSelectedNode(null)}
              sx={{ ml: 'auto' }}
            />
          )}
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ height: 600, border: '1px solid #eee', position: 'relative' }}>
            {graphReady && graphData.nodes.length > 0 ? (
              <ForceGraph2D
                graphData={graphData}
                nodeLabel="name"
                nodeColor={node => (node as GraphNode).color}
                nodeRelSize={6}
                linkWidth={link => (link as GraphLink).value * 3}
                linkColor={link => (link as GraphLink).color}
                onNodeClick={handleNodeClick}
                cooldownTicks={100}
                nodeCanvasObjectMode={() => nodeLabelVisible ? 'after' : undefined}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  if (!nodeLabelVisible) return;
                  
                  const typedNode = node as GraphNode & { x: number; y: number };
                  const label = typedNode.name;
                  const fontSize = 12/globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = 'black';
                  ctx.fillText(label, typedNode.x, typedNode.y + 12);
                }}
                linkDirectionalArrowLength={3}
                linkDirectionalArrowRelPos={1}
                linkCurvature={0.25}
              />
            ) : (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%' 
              }}>
                <Typography variant="h6" color="text.secondary">
                  Nenhuma relação encontrada para este fluxo
                </Typography>
              </Box>
            )}
          </Box>
        )}
        
        {selectedNode && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              {selectedNode.name}
            </Typography>
            
            {selectedNode.description && (
              <Typography variant="body2" paragraph>
                {selectedNode.description}
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Chip 
                label={selectedNode.isPrimary ? 'Indicador Primário' : 'Indicador Derivado'} 
                color={selectedNode.isPrimary ? 'success' : 'default'}
                size="small"
              />
              
              {selectedNode.status && (
                <Chip 
                  label={
                    selectedNode.status === 'above' 
                      ? 'Acima da Meta' 
                      : selectedNode.status === 'below' 
                        ? 'Abaixo da Meta' 
                        : 'Neutro'
                  }
                  color={
                    selectedNode.status === 'above' 
                      ? 'success' 
                      : selectedNode.status === 'below' 
                        ? 'error' 
                        : 'default'
                  }
                  size="small"
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                variant="contained"
                onClick={handleViewIndicator}
              >
                Ver Detalhes do Indicador
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Legenda</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#F57C00', mr: 1 }} />
            <Typography variant="body2">Nó Central</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#4CAF50', mr: 1 }} />
            <Typography variant="body2">Indicador Primário</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#F44336', mr: 1 }} />
            <Typography variant="body2">Abaixo da Meta</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#2196F3', mr: 1 }} />
            <Typography variant="body2">Acima da Meta</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#6C63FF', mr: 1 }} />
            <Typography variant="body2">Indicador Normal</Typography>
          </Box>
        </Box>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Dica: Clique em um nó para centralizá-lo e ver seus detalhes. Você pode arrastar e soltar os nós para reorganizar o grafo.
      </Typography>
    </DashboardLayout>
  );
};

export default IndicatorGraphPage;