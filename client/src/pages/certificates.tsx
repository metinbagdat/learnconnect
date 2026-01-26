import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import MainNavbar from '@/components/layout/MainNavbar';
import AuthGuard from '@/components/auth/AuthGuard';
import { db, collections } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Award, Download, Share2, ExternalLink } from 'lucide-react';

interface Certificate {
  id: string;
  userId: string;
  title: string;
  description: string;
  issuedAt: any;
  verificationCode: string;
  pathId?: string;
  courseId?: string;
}

export default function Certificates() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id && !user?.username) return;

    const fetchCertificates = async () => {
      try {
        const userId = String(user.id || user.username);
        const certsRef = collection(db, collections.certificates);
        const q = query(
          certsRef,
          where('userId', '==', userId),
          orderBy('issuedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        
        const fetchedCerts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Certificate[];

        setCertificates(fetchedCerts);
      } catch (error) {
        console.error('Error fetching certificates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [user]);

  const handleShare = (cert: Certificate) => {
    const verifyUrl = `${window.location.origin}/certificates/verify/${cert.verificationCode}`;
    if (navigator.share) {
      navigator.share({
        title: `Sertifikam: ${cert.title}`,
        text: cert.description,
        url: verifyUrl,
      });
    } else {
      navigator.clipboard.writeText(verifyUrl);
      alert('Doğrulama linki kopyalandı!');
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <MainNavbar />
        <main className="max-w-4xl mx-auto p-4 pb-24">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sertifikalarım</h1>
            <p className="text-gray-600">Kazandığınız sertifikaları görüntüleyin ve paylaşın</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600">Yükleniyor...</p>
            </div>
          ) : certificates.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Henüz Sertifikanız Yok</h2>
              <p className="text-gray-600">
                Öğrenme yollarını tamamlayarak sertifika kazanabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {certificates.map((cert) => (
                <div key={cert.id} className="bg-white rounded-lg shadow p-6 border-2 border-blue-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Award className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{cert.title}</h3>
                        <p className="text-sm text-gray-500">
                          {cert.issuedAt?.toDate?.()?.toLocaleDateString('tr-TR') || 'Tarih bilinmiyor'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4">{cert.description}</p>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      {cert.verificationCode}
                    </span>
                    <span className="text-xs text-gray-500">Doğrulama Kodu</span>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <a
                      href={`/certificates/verify/${cert.verificationCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Görüntüle
                    </a>
                    <button
                      onClick={() => handleShare(cert)}
                      className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
