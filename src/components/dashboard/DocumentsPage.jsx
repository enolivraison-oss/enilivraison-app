import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Plus, Banknote, FileText, Calendar as CalendarIcon, Eye, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DocumentsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const userRole = user?.user_metadata?.role;

  const [bankDeposits, setBankDeposits] = useState([]);
  const [otherDocuments, setOtherDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isBankDepositOpen, setIsBankDepositOpen] = useState(false);
  const [isOtherDocOpen, setIsOtherDocOpen] = useState(false);

  const [bankDepositForm, setBankDepositForm] = useState({ date: new Date(), reference: '', amount: '', file: null });
  const [otherDocForm, setOtherDocForm] = useState({ title: '', description: '', file: null });
  const [uploading, setUploading] = useState(false);

  const [viewingFile, setViewingFile] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data: deposits, error: depositsError } = await supabase.from('bank_deposits').select('*').order('date', { ascending: false });
    if (depositsError) toast({ title: "Erreur", description: depositsError.message, variant: "destructive" });
    else setBankDeposits(deposits || []);

    const { data: docs, error: docsError } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (docsError) toast({ title: "Erreur", description: docsError.message, variant: "destructive" });
    else setOtherDocuments(docs || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e, setForm) => {
    if (e.target.files && e.target.files.length > 0) {
      setForm(prev => ({ ...prev, file: e.target.files[0] }));
    }
  };

  const uploadFile = async (file, bucket) => {
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
    if (uploadError) {
      toast({ title: "Erreur d'upload", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    setUploading(false);
    return data.publicUrl;
  };

  const handleBankDepositSubmit = async (e) => {
    e.preventDefault();
    if (!bankDepositForm.file) {
      toast({ title: "Fichier manquant", description: "Veuillez sélectionner un reçu.", variant: "destructive" });
      return;
    }
    const fileUrl = await uploadFile(bankDepositForm.file, 'receipts');
    if (!fileUrl) return;

    const { date, reference, amount } = bankDepositForm;
    const { error } = await supabase.from('bank_deposits').insert([{ 
      date, 
      reference, 
      amount: parseFloat(amount), 
      receipt_photo_url: fileUrl, 
      user_id: user.id 
    }]);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Succès", description: "Dépôt bancaire ajouté." });
      fetchDocuments();
      setIsBankDepositOpen(false);
      setBankDepositForm({ date: new Date(), reference: '', amount: '', file: null });
    }
  };

  const handleOtherDocSubmit = async (e) => {
    e.preventDefault();
    if (!otherDocForm.file) {
      toast({ title: "Fichier manquant", description: "Veuillez sélectionner un fichier.", variant: "destructive" });
      return;
    }
    const fileUrl = await uploadFile(otherDocForm.file, 'documents');
    if (!fileUrl) return;

    const { title, description } = otherDocForm;
    const { error } = await supabase.from('documents').insert([{ 
      title, 
      description, 
      file_url: fileUrl, 
      file_type: otherDocForm.file.type, 
      user_id: user.id 
    }]);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Succès", description: "Document ajouté." });
      fetchDocuments();
      setIsOtherDocOpen(false);
      setOtherDocForm({ title: '', description: '', file: null });
    }
  };

  const openFileViewer = (fileUrl) => {
    setViewingFile(fileUrl);
    setIsViewerOpen(true);
  };

  const handleDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Network response was not ok.');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName || fileUrl.split('/').pop();
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "✅ Téléchargement lancé", description: "Le fichier est en cours de téléchargement." });
    } catch (error) {
      toast({ title: "Erreur de téléchargement", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id, table, fileUrl, bucket) => {
    if (userRole !== 'ceo') {
      toast({ title: "Action non autorisée", description: "Seul le CEO peut supprimer des documents.", variant: "destructive" });
      return;
    }
    
    const { error: deleteError } = await supabase.from(table).delete().match({ id });
    if (deleteError) {
      toast({ title: "Erreur de suppression", description: deleteError.message, variant: "destructive" });
      return;
    }

    if (fileUrl) {
      const fileName = fileUrl.split('/').pop();
      await supabase.storage.from(bucket).remove([fileName]);
    }

    toast({ title: "✅ Succès", description: "Document supprimé." });
    fetchDocuments();
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestion des Dossiers</h1>
            <p className="text-gray-400">Archivez et consultez vos documents importants.</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isBankDepositOpen} onOpenChange={setIsBankDepositOpen}>
              <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />Dépôt Bancaire</Button></DialogTrigger>
              <DialogContent className="glass-effect"><DialogHeader><DialogTitle>Nouveau Dépôt Bancaire</DialogTitle></DialogHeader>
                <form onSubmit={handleBankDepositSubmit} className="space-y-4">
                  <div className="space-y-2"><Label>Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal glass-effect text-white"><CalendarIcon className="mr-2 h-4 w-4" />{bankDepositForm.date ? format(bankDepositForm.date, "PPP", { locale: fr }) : <span>Choisir une date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0 glass-effect"><Calendar mode="single" selected={bankDepositForm.date} onSelect={(d) => setBankDepositForm(p => ({...p, date: d}))} initialFocus locale={fr} /></PopoverContent></Popover></div>
                  <div className="space-y-2"><Label>Montant (FCFA)</Label><Input type="number" value={bankDepositForm.amount} onChange={(e) => setBankDepositForm(p => ({...p, amount: e.target.value}))} className="glass-effect" required /></div>
                  <div className="space-y-2"><Label>N° de Référence</Label><Input value={bankDepositForm.reference} onChange={(e) => setBankDepositForm(p => ({...p, reference: e.target.value}))} className="glass-effect" /></div>
                  <div className="space-y-2"><Label>Reçu (Image/PDF)</Label><Input type="file" onChange={(e) => handleFileChange(e, setBankDepositForm)} className="glass-effect file:text-white" accept="image/*,application/pdf" required /></div>
                  <Button type="submit" className="w-full" disabled={uploading}>{uploading ? 'Chargement...' : 'Enregistrer'}</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={isOtherDocOpen} onOpenChange={setIsOtherDocOpen}>
              <DialogTrigger asChild><Button className="bg-green-600 hover:bg-green-700"><Plus className="w-4 h-4 mr-2" />Autre Document</Button></DialogTrigger>
              <DialogContent className="glass-effect"><DialogHeader><DialogTitle>Nouveau Document</DialogTitle></DialogHeader>
                <form onSubmit={handleOtherDocSubmit} className="space-y-4">
                  <div className="space-y-2"><Label>Titre</Label><Input value={otherDocForm.title} onChange={(e) => setOtherDocForm(p => ({...p, title: e.target.value}))} className="glass-effect" required /></div>
                  <div className="space-y-2"><Label>Description</Label><Input value={otherDocForm.description} onChange={(e) => setOtherDocForm(p => ({...p, description: e.target.value}))} className="glass-effect" /></div>
                  <div className="space-y-2"><Label>Fichier</Label><Input type="file" onChange={(e) => handleFileChange(e, setOtherDocForm)} className="glass-effect file:text-white" required /></div>
                  <Button type="submit" className="w-full" disabled={uploading}>{uploading ? 'Chargement...' : 'Enregistrer'}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="bank_deposits" className="space-y-6">
        <TabsList className="bg-gray-800/80"><TabsTrigger value="bank_deposits" className="data-[state=active]:bg-gray-900/80 text-white">Dépôts Bancaires</TabsTrigger><TabsTrigger value="other_docs" className="data-[state=active]:bg-gray-900/80 text-white">Autres Documents</TabsTrigger></TabsList>
        
        <TabsContent value="bank_deposits">
          <Card className="glass-effect"><CardHeader><CardTitle className="text-white">Historique des Dépôts</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bankDeposits.map(d => (
                  <Card key={d.id} className="bg-gray-800/50 border-gray-700">
                    <CardHeader><CardTitle className="text-blue-400 flex items-center gap-2"><Banknote /> Dépôt</CardTitle><CardDescription>{format(new Date(d.date), 'dd MMMM yyyy', { locale: fr })}</CardDescription></CardHeader>
                    <CardContent>
                      <p className="text-lg font-bold text-white">{parseFloat(d.amount).toLocaleString('fr-FR')} FCFA</p>
                      <p className="text-sm text-gray-400">Réf: {d.reference || 'N/A'}</p>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" className="glass-effect" onClick={() => openFileViewer(d.receipt_photo_url)}><Eye className="w-4 h-4 mr-2" />Voir</Button>
                        <Button size="sm" variant="outline" className="glass-effect" onClick={() => handleDownload(d.receipt_photo_url, `depot_${d.reference || d.id}.${d.receipt_photo_url.split('.').pop()}`)}><Download className="w-4 h-4 mr-2" />Télécharger</Button>
                        {userRole === 'ceo' && <Button size="sm" variant="destructive" onClick={() => handleDelete(d.id, 'bank_deposits', d.receipt_photo_url, 'receipts')}><Trash2 className="w-4 h-4" /></Button>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {bankDeposits.length === 0 && !loading && <p className="text-gray-400 col-span-full text-center py-8">Aucun dépôt bancaire enregistré.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="other_docs">
          <Card className="glass-effect"><CardHeader><CardTitle className="text-white">Autres Documents</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherDocuments.map(d => (
                  <Card key={d.id} className="bg-gray-800/50 border-gray-700">
                    <CardHeader><CardTitle className="text-green-400 flex items-center gap-2"><FileText /> {d.title}</CardTitle><CardDescription>{format(new Date(d.created_at), 'dd MMMM yyyy', { locale: fr })}</CardDescription></CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-300 mb-4">{d.description || 'Pas de description.'}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="glass-effect" onClick={() => openFileViewer(d.file_url)}><Eye className="w-4 h-4 mr-2" />Voir</Button>
                        <Button size="sm" variant="outline" className="glass-effect" onClick={() => handleDownload(d.file_url, `${d.title.replace(/\s+/g, '_')}.${d.file_url.split('.').pop()}`)}><Download className="w-4 h-4 mr-2" />Télécharger</Button>
                        {userRole === 'ceo' && <Button size="sm" variant="destructive" onClick={() => handleDelete(d.id, 'documents', d.file_url, 'documents')}><Trash2 className="w-4 h-4" /></Button>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {otherDocuments.length === 0 && !loading && <p className="text-gray-400 col-span-full text-center py-8">Aucun autre document enregistré.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-4xl h-[90vh] glass-effect p-2">
          {viewingFile && (
            viewingFile.endsWith('.pdf') ? (
              <iframe src={viewingFile} className="w-full h-full rounded-md" title="Visualiseur de document"></iframe>
            ) : (
              <img src={viewingFile} alt="Aperçu du document" className="w-full h-full object-contain" />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentsPage;