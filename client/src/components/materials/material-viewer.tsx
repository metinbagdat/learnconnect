import { useState } from "react";
import { 
  FileText, 
  Video, 
  BookOpen, 
  Image as ImageIcon,
  Link as LinkIcon,
  File,
  Download,
  X,
  ExternalLink,
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MaterialType = "book" | "slide" | "text" | "document" | "video" | "link" | "image";

interface Material {
  id: number;
  title: string;
  titleTr: string;
  titleEn: string;
  description: string;
  descriptionTr: string;
  descriptionEn: string;
  materialType: MaterialType;
  tags: string[];
  subjectArea?: string;
  isAiGenerated: boolean;
  isPublic: boolean;
  externalUrl?: string;
  uploadId?: number;
  content?: string;
  createdAt: string;
}

interface MaterialViewerProps {
  material: Material | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getMaterialIcon(type: MaterialType) {
  switch (type) {
    case "book":
      return <BookOpen className="h-6 w-6 text-blue-500" />;
    case "slide":
      return <FileText className="h-6 w-6 text-purple-500" />;
    case "text":
      return <FileText className="h-6 w-6 text-green-500" />;
    case "document":
      return <File className="h-6 w-6 text-orange-500" />;
    case "video":
      return <Video className="h-6 w-6 text-red-500" />;
    case "link":
      return <LinkIcon className="h-6 w-6 text-indigo-500" />;
    case "image":
      return <ImageIcon className="h-6 w-6 text-pink-500" />;
    default:
      return <FileText className="h-6 w-6 text-gray-500" />;
  }
}

export function MaterialViewer({ material, open, onOpenChange }: MaterialViewerProps) {
  if (!material) return null;

  const handleDownload = () => {
    if (material.externalUrl) {
      window.open(material.externalUrl, "_blank");
    } else if (material.uploadId) {
      // Download from upload endpoint
      window.open(`/api/uploads/${material.uploadId}/download`, "_blank");
    }
  };

  const handleOpenLink = () => {
    if (material.externalUrl) {
      window.open(material.externalUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getMaterialIcon(material.materialType)}
              <div>
                <DialogTitle className="text-2xl">
                  {material.titleTr || material.title}
                </DialogTitle>
                {material.titleEn && material.titleEn !== material.titleTr && (
                  <p className="text-sm text-gray-500 mt-1">{material.titleEn}</p>
                )}
              </div>
            </div>
            {material.isAiGenerated && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                AI Generated
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Description */}
          {material.descriptionTr && (
            <div>
              <h3 className="font-semibold mb-2">Açıklama</h3>
              <p className="text-gray-700">{material.descriptionTr || material.description}</p>
              {material.descriptionEn && material.descriptionEn !== material.descriptionTr && (
                <p className="text-gray-600 mt-2 text-sm">{material.descriptionEn}</p>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Tip:</span>
              <p className="text-sm">{material.materialType}</p>
            </div>
            {material.subjectArea && (
              <div>
                <span className="text-sm font-medium text-gray-500">Konu Alanı:</span>
                <p className="text-sm">{material.subjectArea}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-gray-500">Oluşturulma Tarihi:</span>
              <p className="text-sm">{new Date(material.createdAt).toLocaleDateString("tr-TR")}</p>
            </div>
          </div>

          {/* Tags */}
          {material.tags && material.tags.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-500 mb-2 block">Etiketler:</span>
              <div className="flex flex-wrap gap-2">
                {material.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="border-t pt-4">
            {material.materialType === "link" && material.externalUrl ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <ExternalLink className="h-12 w-12 mx-auto text-indigo-500 mb-4" />
                    <p className="mb-4">Bu materyal harici bir link içermektedir.</p>
                    <Button onClick={handleOpenLink} variant="default">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Linki Aç
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : material.materialType === "video" && material.externalUrl ? (
              <div>
                <h3 className="font-semibold mb-2">Video İçeriği</h3>
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                  <video 
                    src={material.externalUrl} 
                    controls 
                    className="w-full h-full rounded-lg"
                  >
                    Video yüklenemedi
                  </video>
                </div>
              </div>
            ) : material.materialType === "image" && (material.externalUrl || material.uploadId) ? (
              <div>
                <h3 className="font-semibold mb-2">Görsel</h3>
                <img 
                  src={material.externalUrl || `/api/uploads/${material.uploadId}/download`}
                  alt={material.titleTr || material.title}
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            ) : material.materialType === "text" && material.content ? (
              <div>
                <h3 className="font-semibold mb-2">İçerik</h3>
                <div className="prose max-w-none p-4 bg-gray-50 rounded-lg">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {material.content}
                  </pre>
                </div>
              </div>
            ) : material.uploadId ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <File className="h-12 w-12 mx-auto text-orange-500 mb-4" />
                    <p className="mb-4">Bu materyal bir dosya içermektedir.</p>
                    <Button onClick={handleDownload} variant="default">
                      <Download className="h-4 w-4 mr-2" />
                      Dosyayı İndir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Bu materyal için görüntülenebilir içerik bulunmamaktadır.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            {(material.externalUrl || material.uploadId) && (
              <Button onClick={handleDownload} variant="default">
                <Download className="h-4 w-4 mr-2" />
                {material.materialType === "link" ? "Linki Aç" : "İndir"}
              </Button>
            )}
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Kapat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

