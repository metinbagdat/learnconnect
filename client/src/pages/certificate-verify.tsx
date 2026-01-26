import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { db, collections } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Award, CheckCircle2, XCircle, Calendar } from 'lucide-react';

interface Certificate {
  id: string;
  userId: string;
  userName?: string;
  title: string;
  description: string;
  issuedAt: any;
  verificationCode: string;
  pathId?: string;
  courseId?: string;
}

export default function CertificateVerify() {
  const [location] = useLocation();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract verification code from URL
  const verificationCode = location.split('/certificates/verify/')[1]?.split('?')[0];

  useEffect(() => {
    if (!verificationCode) {
      setError('Doğrulama kodu bulunamadı');
      setLoading(false);
      return;
    }

    const fetchCertificate = async () => {
      try {
        const certsRef = collection(db, collections.certificates);
        const q = query(
          certsRef,
          where('verificationCode', '==', verificationCode),
          limit(1)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setError('Sertifika bulunamadı. Doğrulama kodunu kontrol edin.');
          setLoading(false);
          return;
        }

        const certData = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        } as Certificate;

        setCertificate(certData);
      } catch (error) {
        console.error('Error fetching certificate:', error);
        setError('Sertifika doğrulanırken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [verificationCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Doğrulanıyor...</p>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sertifika Bulunamadı</h1>
          <p className="text-gray-600 mb-6">{error || 'Geçersiz doğrulama kodu'}</p>
          <a
            href="/"
            className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700"
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
        {/* Certificate Header */}
        <div className="text-center mb-8 border-b-2 border-blue-200 pb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sertifika</h1>
          <p className="text-gray-600">egitim.today</p>
        </div>

        {/* Certificate Content */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{certificate.title}</h2>
          <p className="text-lg text-gray-700 mb-6">{certificate.description}</p>
          
          {certificate.userName && (
            <div className="mb-6">
              <p className="text-gray-600 mb-2">Bu sertifika</p>
              <p className="text-xl font-semibold text-gray-900">{certificate.userName}</p>
              <p className="text-gray-600">kişisine verilmiştir</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-gray-600 mb-6">
            <Calendar className="w-5 h-5" />
            <span>
              {certificate.issuedAt?.toDate?.()?.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }) || 'Tarih bilinmiyor'}
            </span>
          </div>
        </div>

        {/* Verification Badge */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-green-700">
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-semibold">Sertifika Doğrulandı</span>
          </div>
          <p className="text-center text-sm text-green-600 mt-2">
            Doğrulama Kodu: <span className="font-mono font-semibold">{certificate.verificationCode}</span>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 border-t pt-6">
          <p>Bu sertifika egitim.today platformu tarafından verilmiştir.</p>
          <p className="mt-2">
            Doğrulama: <span className="font-mono">{window.location.href}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
