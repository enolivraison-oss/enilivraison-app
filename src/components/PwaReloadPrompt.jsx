import React, { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

function PwaReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('Service Worker registered:', r);
    },
    onRegisterError(error) {
      console.log('Service Worker registration error:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!needRefresh && !offlineReady) {
    return null;
  }

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <Card className="glass-effect border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">
            {offlineReady ? 'Prêt pour le mode hors ligne' : 'Mise à jour disponible'}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {offlineReady ? 'L\'application peut maintenant être utilisée hors ligne.' : 'Une nouvelle version est disponible. Rechargez pour mettre à jour.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          {needRefresh && (
            <Button onClick={() => updateServiceWorker(true)} className="bg-green-500 hover:bg-green-600">
              <RefreshCw className="w-4 h-4 mr-2" />
              Recharger
            </Button>
          )}
          <Button variant="outline" onClick={close} className="glass-effect hover:bg-gray-700">
            Fermer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default PwaReloadPrompt;