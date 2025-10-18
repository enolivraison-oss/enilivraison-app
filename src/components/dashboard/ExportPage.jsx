import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, FileText, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/customSupabaseClient';

const dataTypes = {
  accounting: { label: 'Comptabilité', tables: ['transactions', 'standard_orders', 'partner_delivery_fees'] },
  salaries: { label: 'Salaires', tables: ['salaries'] },
  partners: { label: 'Partenaires', tables: ['partners'] },
  products: { label: 'Produits', tables: ['products'] },
  stockMovements: { label: 'Mouvements de Stock', tables: ['stock_movements'] },
  users: { label: 'Utilisateurs', tables: ['profiles'] },
};

const ExportPage = () => {
  const { toast } = useToast();
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [exportFormat, setExportFormat] = useState('pdf');

  const handleTypeToggle = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const generatePdf = async (dataToExport) => {
    const doc = new jsPDF();
    let yPos = 22;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Eno Livraison', 14, yPos);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    yPos += 8;
    doc.text(`Rapport d'Exportation`, 14, yPos);
    yPos += 6;
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, yPos);
    yPos += 15;

    for (const type in dataToExport) {
      if (dataToExport[type].length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(dataTypes[type].label, 14, yPos);
        yPos += 8;

        const headers = Object.keys(dataToExport[type][0]);
        const body = dataToExport[type].map(row => Object.values(row));

        doc.autoTable({
          head: [headers],
          body: body,
          startY: yPos,
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94] },
        });

        yPos = doc.lastAutoTable.finalY + 15;
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
      }
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Page ${i} sur ${pageCount}`, doc.internal.pageSize.width - 35, doc.internal.pageSize.height - 10);
      doc.text('© Eno Livraison', 14, doc.internal.pageSize.height - 10);
    }

    doc.save(`export_eno_livraison_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const generateXlsx = (dataToExport) => {
    const wb = XLSX.utils.book_new();
    for (const type in dataToExport) {
      if (dataToExport[type].length > 0) {
        const ws = XLSX.utils.json_to_sheet(dataToExport[type]);
        XLSX.utils.book_append_sheet(wb, ws, dataTypes[type].label.substring(0, 31));
      }
    }
    XLSX.writeFile(wb, `export_eno_livraison_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handleExport = async () => {
    if (selectedTypes.length === 0) {
      toast({ title: "Aucune sélection", description: "Veuillez sélectionner au moins un type de données à exporter.", variant: "destructive" });
      return;
    }

    toast({ title: "Exportation en cours...", description: "Veuillez patienter pendant la collecte des données." });

    try {
      let dataToExport = {};
      for (const type of selectedTypes) {
        const tables = dataTypes[type].tables;
        for (const table of tables) {
          const { data, error } = await supabase.from(table).select('*');
          if (error) throw error;
          
          if (!dataToExport[type]) dataToExport[type] = [];
          
          // Flatten nested objects for better export
          const flattenedData = data.map(item => {
            const flatItem = {};
            for (const key in item) {
              if (typeof item[key] === 'object' && item[key] !== null && !Array.isArray(item[key])) {
                for (const subKey in item[key]) {
                  flatItem[`${key}_${subKey}`] = item[key][subKey];
                }
              } else if (Array.isArray(item[key])) {
                flatItem[key] = JSON.stringify(item[key]);
              } else {
                flatItem[key] = item[key];
              }
            }
            return flatItem;
          });

          dataToExport[type] = [...dataToExport[type], ...flattenedData];
        }
      }

      if (exportFormat === 'pdf') {
        await generatePdf(dataToExport);
      } else {
        generateXlsx(dataToExport);
      }

      toast({ title: "✅ Exportation réussie", description: `Le fichier ${exportFormat.toUpperCase()} a été généré.` });
    } catch (error) {
      toast({ title: "❌ Erreur d'exportation", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="text-3xl font-bold text-white mb-2">Exporter les Données</h1>
        <p className="text-gray-400">Exportez les données de la plateforme en format PDF ou Excel.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="text-white">Configuration de l'Exportation</CardTitle>
            <CardDescription className="text-gray-400">
              Choisissez les données à exporter et le format de fichier souhaité.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <Label className="text-lg font-semibold text-white">1. Choisir les données à exporter</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {Object.entries(dataTypes).map(([key, { label }]) => (
                  <div key={key} className="flex items-center space-x-2 p-3 rounded-lg bg-gray-800/50">
                    <Checkbox id={key} checked={selectedTypes.includes(key)} onCheckedChange={() => handleTypeToggle(key)} />
                    <Label htmlFor={key} className="text-white cursor-pointer">{label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-lg font-semibold text-white">2. Choisir le format d'exportation</Label>
              <div className="mt-4">
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger className="w-[220px] glass-effect text-white">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent className="glass-effect">
                    <SelectItem value="pdf"><div className="flex items-center"><FileText className="w-4 h-4 mr-2" />PDF</div></SelectItem>
                    <SelectItem value="xlsx"><div className="flex items-center"><FileSpreadsheet className="w-4 h-4 mr-2" />Excel (XLSX)</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={handleExport} className="bg-gradient-to-r from-green-500 to-emerald-600 w-full sm:w-auto">
                <FileDown className="w-4 h-4 mr-2" />
                Lancer l'Exportation
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ExportPage;