import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, RotateCcw, Search, RefreshCw, Loader2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/MetricBadge';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import {
  useCriativosArquivados,
  useUpdateCriativo,
  useDeleteCriativo,
  useOfertasAtivas,
  useCopywriters,
} from '@/hooks/useSupabase';
import type { Criativo } from '@/services/api';

const sourceColors: Record<string, string> = {
  facebook: 'bg-info/10 text-info',
  youtube: 'bg-destructive/10 text-destructive',
  tiktok: 'bg-purple-500/10 text-purple-500',
};

const sourceLabels: Record<string, string> = {
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
};

export default function ArchivedCreatives() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [offerFilter, setOfferFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [copywriterFilter, setCopywriterFilter] = useState<string>('all');
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState<Criativo | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState('');

  // Hooks
  const { data: criativos, isLoading, refetch } = useCriativosArquivados();
  const { data: ofertas } = useOfertasAtivas();
  const { data: copywriters } = useCopywriters();
  const updateCriativo = useUpdateCriativo();
  const deleteCriativo = useDeleteCriativo();

  // Filter creatives
  const filteredCreatives = (criativos || []).filter((creative) => {
    const matchesSearch = creative.id_unico.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOffer = offerFilter === 'all' || creative.oferta_id === offerFilter;
    const matchesSource = sourceFilter === 'all' || creative.fonte === sourceFilter;
    const matchesCopywriter = copywriterFilter === 'all' || creative.copy_responsavel === copywriterFilter;
    return matchesSearch && matchesOffer && matchesSource && matchesCopywriter;
  });

  const getOfferName = (offerId: string | null) => {
    if (!offerId) return 'Sem oferta';
    const offer = (ofertas || []).find((o) => o.id === offerId);
    return offer?.nome || 'N/A';
  };

  const handleDeleteClick = (creative: Criativo) => {
    setSelectedCreative(creative);
    setDeleteConfirmId('');
    setIsDeleteDialogOpen(true);
  };

  const handleRestore = async (creative: Criativo) => {
    try {
      await updateCriativo.mutateAsync({
        id: creative.id,
        updates: { status: 'pausado' }
      });
      toast.success(`"${creative.id_unico}" foi restaurado com status pausado.`);
    } catch (error) {
      toast.error('Não foi possível restaurar o criativo.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCreative || deleteConfirmId !== selectedCreative.id_unico) return;
    
    try {
      await deleteCriativo.mutateAsync(selectedCreative.id);
      toast.success(`"${selectedCreative.id_unico}" foi excluído permanentemente.`);
      setIsDeleteDialogOpen(false);
      setSelectedCreative(null);
      setDeleteConfirmId('');
    } catch (error) {
      toast.error('Não foi possível excluir o criativo. Verifique se não há métricas vinculadas.');
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Lista de criativos arquivados foi atualizada.');
  };

  const isDeleteEnabled = selectedCreative && deleteConfirmId === selectedCreative.id_unico;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/criativos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Criativos Arquivados</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredCreatives.length} criativo(s) arquivado(s)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID do criativo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={offerFilter} onValueChange={setOfferFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Oferta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Ofertas</SelectItem>
              {(ofertas || []).map((offer) => (
                <SelectItem key={offer.id} value={offer.id}>{offer.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Fontes</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>
          <Select value={copywriterFilter} onValueChange={setCopywriterFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Copywriter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Copywriters</SelectItem>
              {(copywriters || []).map((copy) => (
                <SelectItem key={copy.id} value={copy.nome}>{copy.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data Criação</TableHead>
              <TableHead className="w-[60px]">Thumb</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Oferta</TableHead>
              <TableHead>Fonte</TableHead>
              <TableHead>Copywriter</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCreatives.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum criativo arquivado encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredCreatives.map((creative) => (
                <TableRow key={creative.id}>
                  <TableCell>
                    {creative.created_at ? formatDate(creative.created_at) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      <Image className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{creative.id_unico}</TableCell>
                  <TableCell>{getOfferName(creative.oferta_id)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                      sourceColors[creative.fonte] || 'bg-muted text-muted-foreground'
                    }`}>
                      {sourceLabels[creative.fonte] || creative.fonte}
                    </span>
                  </TableCell>
                  <TableCell>{creative.copy_responsavel || '-'}</TableCell>
                  <TableCell><StatusBadge status="archived" /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleRestore(creative)}
                        disabled={updateCriativo.isPending}
                        title="Restaurar criativo"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(creative)}
                        title="Excluir permanentemente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Excluir Criativo Permanentemente</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Todos os dados do criativo serão perdidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium mb-2">
                Você está prestes a excluir: <strong>{selectedCreative?.id_unico}</strong>
              </p>
              <p className="text-xs text-destructive/80">
                Para confirmar, digite exatamente o ID do criativo abaixo:
              </p>
              <p className="text-sm font-mono font-bold text-destructive mt-1">
                {selectedCreative?.id_unico}
              </p>
            </div>
            <div className="grid gap-2">
              <label htmlFor="confirm-id" className="text-sm font-medium">
                Digite o ID do criativo para confirmar
              </label>
              <Input
                id="confirm-id"
                value={deleteConfirmId}
                onChange={(e) => setDeleteConfirmId(e.target.value)}
                placeholder="Digite o ID do criativo"
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={!isDeleteEnabled || deleteCriativo.isPending}
            >
              {deleteCriativo.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir Permanentemente'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
