import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Award, Download } from 'lucide-react';

export default function CertificatesViewer() {
  const { data: certificatesData, isLoading } = useQuery<any>({
    queryKey: ['/api/certificates'],
  });
  
  const certificates: any[] = Array.isArray(certificatesData) ? certificatesData : [];

  if (isLoading) {
    return <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">🎓 My Certificates</h2>
      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map((cert: any) => (
            <Card key={cert.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <Award className="w-8 h-8 text-yellow-500" />
                <Badge>{cert.status}</Badge>
              </div>
              <h3 className="font-bold mb-2">{cert.courseTitle}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Issued: {new Date(cert.issueDate).toLocaleDateString()}
              </p>
              <div className="text-sm mb-4">
                <p>Grade: <span className="font-bold">{cert.grade}%</span></p>
                <p className="text-xs text-slate-500">Code: {cert.verificationCode}</p>
              </div>
              <Button size="sm" className="w-full gap-2">
                <Download className="w-4 h-4" /> Download
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Complete courses to earn certificates!</p>
        </Card>
      )}
    </div>
  );
}
