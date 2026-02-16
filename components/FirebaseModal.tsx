
import React, { useState } from 'react';
import { X, Cloud, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (config: any) => void;
}

const FirebaseModal: React.FC<FirebaseModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [configText, setConfigText] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConnect = () => {
    try {
      // Try to parse the config from the text. 
      // It might be a JS object (copy-pasted) or raw JSON.
      // A simple trick to handle both is to look for the object content.
      let cleanText = configText.trim();
      if (cleanText.includes('const firebaseConfig =')) {
        cleanText = cleanText.split('=')[1].split(';')[0].trim();
      }
      
      // Using eval-like logic but safer for specific pattern if needed, 
      // but here we expect something that can be JSON parsed or converted.
      // For a quick hack that handles JS objects:
      const config = new Function(`return ${cleanText}`)();
      
      if (!config.apiKey || !config.projectId) {
        throw new Error('Geçersiz Firebase yapılandırması.');
      }
      
      onConnect(config);
      onClose();
    } catch (e) {
      setError('Yapılandırma formatı hatalı. Lütfen Firebase Console\'dan kopyaladığınız objeyi yapıştırın.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header - Maroon style from image */}
        <div className="bg-[#a50034] p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Cloud size={24} fill="currentColor" />
            <h2 className="text-xl font-bold">Firebase Kurulumu</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          {/* Warning Box */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-2 text-amber-700 font-bold">
              <AlertTriangle size={18} />
              Önemli
            </div>
            <p className="text-sm text-amber-800 leading-relaxed">
              Notlarınızı gerçek zamanlı senkronize etmek için Firebase proje ayarlarınızı buraya yapıştırın. 
              Bu ayarları <span className="font-bold">Firebase Console -> Project Settings -> General</span> kısmından alabilirsiniz.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Firebase Config JSON</label>
            <textarea 
              placeholder={`const firebaseConfig = {\n  apiKey: "...",\n  authDomain: "...",\n  projectId: "...",\n  ...\n};`}
              className="w-full h-48 bg-gray-50 border border-gray-200 rounded-2xl p-4 font-mono text-xs text-gray-600 focus:ring-2 focus:ring-[#fbb03b] outline-none resize-none transition-all"
              value={configText}
              onChange={(e) => {
                setConfigText(e.target.value);
                setError('');
              }}
            />
            {error && <p className="text-red-500 text-xs mt-2 font-bold">{error}</p>}
          </div>

          <div className="flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
            >
              Kapat
            </button>
            <button 
              onClick={handleConnect}
              className="bg-[#fbb03b] hover:bg-[#f39c12] text-green-900 px-8 py-3 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-orange-200 active:scale-95"
            >
              Kaydet ve Bağlan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseModal;
