import { useState, useRef } from "react";
import { Upload, X, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

type MaterialType = "book" | "slide" | "text" | "document" | "video" | "link" | "image";

interface MaterialUploadProps {
  onUploadSuccess?: (material: any) => void;
  onCancel?: () => void;
  defaultCourseId?: number;
}

export function MaterialUpload({ onUploadSuccess, onCancel, defaultCourseId }: MaterialUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    titleTr: "",
    titleEn: "",
    description: "",
    descriptionTr: "",
    descriptionEn: "",
    materialType: "text" as MaterialType,
    tags: "",
    subjectArea: "",
    isPublic: false,
    courseId: defaultCourseId || null as number | null,
    externalUrl: "",
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    
    // Auto-detect material type from file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    let detectedType: MaterialType = "document";
    
    if (['pdf', 'doc', 'docx'].includes(extension || '')) {
      detectedType = "document";
    } else if (['ppt', 'pptx'].includes(extension || '')) {
      detectedType = "slide";
    } else if (['mp4', 'avi', 'mov', 'webm'].includes(extension || '')) {
      detectedType = "video";
    } else if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension || '')) {
      detectedType = "image";
    }
    
    setFormData({ ...formData, materialType: detectedType });
    
    // Auto-fill title if empty
    if (!formData.titleTr) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setFormData({ ...formData, titleTr: nameWithoutExt, title: nameWithoutExt, materialType: detectedType });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let uploadId: number | null = null;

      // For file uploads, we'll store metadata only for now
      // Actual file storage implementation can be added later
      // For now, materials with files should use externalUrl or be text-based
      if (selectedFile && (formData.materialType === "video" || formData.materialType === "image")) {
        // For video/image types with files, we'd need actual file storage
        // For now, suggest using externalUrl instead
        if (!formData.externalUrl) {
          toast({
            title: "Bilgi",
            description: "Dosya yükleme şu an desteklenmiyor. Lütfen harici bir URL kullanın.",
            variant: "default",
          });
          // Continue without uploadId - file can be uploaded separately later
        }
      }

      // Create material
      const materialData = {
        title: formData.titleTr || formData.title,
        titleTr: formData.titleTr || formData.title,
        titleEn: formData.titleEn || formData.title,
        description: formData.descriptionTr || formData.description,
        descriptionTr: formData.descriptionTr || formData.description,
        descriptionEn: formData.descriptionEn || formData.description,
        materialType: formData.materialType,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        subjectArea: formData.subjectArea || null,
        isPublic: formData.isPublic,
        courseId: formData.courseId || null,
        externalUrl: formData.externalUrl || null,
        uploadId: uploadId,
      };

      const response = await apiRequest('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(materialData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Materyal oluşturulurken hata oluştu');
      }

      const material = await response.json();
      
      toast({
        title: "Başarılı",
        description: "Materyal başarıyla oluşturuldu",
      });

      if (onUploadSuccess) {
        onUploadSuccess(material);
      }

      // Reset form
      setFormData({
        title: "",
        titleTr: "",
        titleEn: "",
        description: "",
        descriptionTr: "",
        descriptionEn: "",
        materialType: "text",
        tags: "",
        subjectArea: "",
        isPublic: false,
        courseId: defaultCourseId || null,
        externalUrl: "",
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Material Type */}
          <div>
            <Label htmlFor="materialType">Materyal Tipi *</Label>
            <Select
              value={formData.materialType}
              onValueChange={(value: MaterialType) => setFormData({ ...formData, materialType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Metin</SelectItem>
                <SelectItem value="document">Döküman</SelectItem>
                <SelectItem value="slide">Slayt</SelectItem>
                <SelectItem value="book">Kitap</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="image">Görsel</SelectItem>
                <SelectItem value="link">Link</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload Area */}
          {(formData.materialType === "document" || 
            formData.materialType === "slide" || 
            formData.materialType === "video" || 
            formData.materialType === "image") && (
            <div>
              <Label>Dosya Yükle</Label>
              <div
                className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? "border-primary bg-primary/5" 
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Kaldır
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">
                        Dosyayı buraya sürükleyin veya tıklayarak seçin
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, DOC, PPT, Video, Görsel formatları desteklenir
                      </p>
                    </div>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileInputChange}
                      accept={
                        formData.materialType === "video" 
                          ? "video/*" 
                          : formData.materialType === "image"
                          ? "image/*"
                          : formData.materialType === "slide"
                          ? ".ppt,.pptx"
                          : ".pdf,.doc,.docx"
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Dosya Seç
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* External URL for link type */}
          {formData.materialType === "link" && (
            <div>
              <Label htmlFor="externalUrl">Link URL *</Label>
              <Input
                id="externalUrl"
                type="url"
                value={formData.externalUrl}
                onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>
          )}

          {/* Title */}
          <div>
            <Label htmlFor="titleTr">Başlık (Türkçe) *</Label>
            <Input
              id="titleTr"
              value={formData.titleTr}
              onChange={(e) => setFormData({ ...formData, titleTr: e.target.value, title: e.target.value })}
              placeholder="Materyal başlığı"
              required
            />
          </div>

          <div>
            <Label htmlFor="titleEn">Başlık (İngilizce)</Label>
            <Input
              id="titleEn"
              value={formData.titleEn}
              onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
              placeholder="Material title"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="descriptionTr">Açıklama (Türkçe)</Label>
            <Textarea
              id="descriptionTr"
              value={formData.descriptionTr}
              onChange={(e) => setFormData({ ...formData, descriptionTr: e.target.value, description: e.target.value })}
              placeholder="Materyal açıklaması"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="descriptionEn">Açıklama (İngilizce)</Label>
            <Textarea
              id="descriptionEn"
              value={formData.descriptionEn}
              onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
              placeholder="Material description"
              rows={3}
            />
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Etiketler (virgülle ayırın)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="etiket1, etiket2, etiket3"
            />
          </div>

          {/* Subject Area */}
          <div>
            <Label htmlFor="subjectArea">Konu Alanı</Label>
            <Input
              id="subjectArea"
              value={formData.subjectArea}
              onChange={(e) => setFormData({ ...formData, subjectArea: e.target.value })}
              placeholder="Örn: Matematik, Fizik"
            />
          </div>

          {/* Public Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="isPublic">Herkese açık (Genel paylaşımlı materyal)</Label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                İptal
              </Button>
            )}
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Yükleniyor..." : "Oluştur"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

