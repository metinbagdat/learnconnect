import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { 
  FileText, 
  Video, 
  BookOpen, 
  Image as ImageIcon,
  Link as LinkIcon,
  File,
  Plus,
  Edit,
  Trash2,
  Download,
  Search,
  Filter,
  Upload,
  Users,
  BarChart3,
  UserPlus,
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MaterialUpload } from "@/components/materials/material-upload";

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
  courseId?: number;
  courseName?: string;
  createdAt: string;
  updatedAt: string;
}

interface MaterialFormData {
  title: string;
  titleTr: string;
  titleEn: string;
  description: string;
  descriptionTr: string;
  descriptionEn: string;
  materialType: MaterialType;
  tags: string[];
  subjectArea?: string;
  isPublic: boolean;
  courseId?: number | null;
  externalUrl?: string;
}

function getMaterialIcon(type: MaterialType) {
  switch (type) {
    case "book":
      return <BookOpen className="h-5 w-5 text-blue-500" />;
    case "slide":
      return <FileText className="h-5 w-5 text-purple-500" />;
    case "text":
      return <FileText className="h-5 w-5 text-green-500" />;
    case "document":
      return <File className="h-5 w-5 text-orange-500" />;
    case "video":
      return <Video className="h-5 w-5 text-red-500" />;
    case "link":
      return <LinkIcon className="h-5 w-5 text-indigo-500" />;
    case "image":
      return <ImageIcon className="h-5 w-5 text-pink-500" />;
    default:
      return <FileText className="h-5 w-5 text-gray-500" />;
  }
}

function getMaterialTypeLabel(type: MaterialType): string {
  const labels: Record<MaterialType, string> = {
    book: "Kitap",
    slide: "Slayt",
    text: "Metin",
    document: "Döküman",
    video: "Video",
    link: "Link",
    image: "Görsel",
  };
  return labels[type] || type;
}

export default function AdvisorMaterialDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [assigningMaterial, setAssigningMaterial] = useState<Material | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState("");
  
  const [formData, setFormData] = useState<MaterialFormData>({
    title: "",
    titleTr: "",
    titleEn: "",
    description: "",
    descriptionTr: "",
    descriptionEn: "",
    materialType: "text",
    tags: [],
    isPublic: false,
    courseId: null,
    externalUrl: "",
  });

  // Fetch mentor's materials
  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ["materials", user?.id],
    queryFn: async () => {
      const response = await apiRequest("/api/materials");
      return response.json();
    },
    enabled: !!user?.id && (user?.role === "instructor" || user?.role === "mentor" || user?.role === "admin"),
  });

  // Fetch courses for dropdown
  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const response = await apiRequest("/api/courses");
      return response.json();
    },
  });

  // Create material mutation
  const createMaterialMutation = useMutation({
    mutationFn: async (data: MaterialFormData) => {
      const response = await apiRequest("/api/materials", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Başarılı",
        description: "Materyal başarıyla oluşturuldu",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Materyal oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Update material mutation
  const updateMaterialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<MaterialFormData> }) => {
      const response = await apiRequest(`/api/materials/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      setEditingMaterial(null);
      resetForm();
      toast({
        title: "Başarılı",
        description: "Materyal başarıyla güncellendi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Materyal güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Assign material mutation
  const assignMaterialMutation = useMutation({
    mutationFn: async ({ materialId, studentId, notes }: { materialId: number; studentId: number; notes?: string }) => {
      const response = await apiRequest(`/api/materials/${materialId}/assign`, {
        method: "POST",
        body: JSON.stringify({ studentId, notes }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      setAssigningMaterial(null);
      setSelectedStudentId(null);
      setAssignmentNotes("");
      toast({
        title: "Başarılı",
        description: "Materyal öğrenciye başarıyla atandı",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Materyal atanırken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Delete material mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/materials/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast({
        title: "Başarılı",
        description: "Materyal başarıyla silindi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Materyal silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      titleTr: "",
      titleEn: "",
      description: "",
      descriptionTr: "",
      descriptionEn: "",
      materialType: "text",
      tags: [],
      isPublic: false,
      courseId: null,
      externalUrl: "",
    });
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      titleTr: material.titleTr,
      titleEn: material.titleEn,
      description: material.description || "",
      descriptionTr: material.descriptionTr || "",
      descriptionEn: material.descriptionEn || "",
      materialType: material.materialType,
      tags: material.tags || [],
      subjectArea: material.subjectArea,
      isPublic: material.isPublic,
      courseId: material.courseId || null,
      externalUrl: material.externalUrl || "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingMaterial) {
      updateMaterialMutation.mutate({ id: editingMaterial.id, data: formData });
    } else {
      createMaterialMutation.mutate(formData);
    }
  };

  const handleDelete = (material: Material) => {
    if (confirm(`"${material.titleTr || material.title}" materyalini silmek istediğinizden emin misiniz?`)) {
      deleteMaterialMutation.mutate(material.id);
    }
  };

  // Filter materials
  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = 
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.titleTr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedType === "all" || material.materialType === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Statistics
  const stats = {
    total: materials.length,
    byType: materials.reduce((acc, m) => {
      acc[m.materialType] = (acc[m.materialType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    public: materials.filter(m => m.isPublic).length,
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Materyal Yönetimi
              </h1>
              <p className="text-gray-600">
                Eğitim materyallerinizi yönetin ve öğrencilerinize atayın
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingMaterial(null); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Materyal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingMaterial ? "Materyal Düzenle" : "Yeni Materyal Oluştur"}
                  </DialogTitle>
                  <DialogDescription>
                    Eğitim materyali bilgilerini girin
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="materialType">Materyal Tipi</Label>
                      <Select
                        value={formData.materialType}
                        onValueChange={(value: MaterialType) => setFormData({ ...formData, materialType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="book">Kitap</SelectItem>
                          <SelectItem value="slide">Slayt</SelectItem>
                          <SelectItem value="text">Metin</SelectItem>
                          <SelectItem value="document">Döküman</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="link">Link</SelectItem>
                          <SelectItem value="image">Görsel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="courseId">Kurs (Opsiyonel)</Label>
                      <Select
                        value={formData.courseId?.toString() || "none"}
                        onValueChange={(value) => setFormData({ ...formData, courseId: value === "none" ? null : parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kurs seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Genel</SelectItem>
                          {courses.map((course: any) => (
                            <SelectItem key={course.id} value={course.id.toString()}>
                              {course.titleTr || course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="titleTr">Başlık (Türkçe)</Label>
                    <Input
                      id="titleTr"
                      value={formData.titleTr}
                      onChange={(e) => setFormData({ ...formData, titleTr: e.target.value, title: e.target.value })}
                      placeholder="Materyal başlığı"
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
                  {formData.materialType === "link" && (
                    <div>
                      <Label htmlFor="externalUrl">Link URL</Label>
                      <Input
                        id="externalUrl"
                        value={formData.externalUrl}
                        onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="subjectArea">Konu Alanı</Label>
                    <Input
                      id="subjectArea"
                      value={formData.subjectArea || ""}
                      onChange={(e) => setFormData({ ...formData, subjectArea: e.target.value })}
                      placeholder="Örn: Matematik, Fizik"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Etiketler (virgülle ayırın)</Label>
                    <Input
                      id="tags"
                      value={formData.tags.join(", ")}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                      placeholder="etiket1, etiket2, etiket3"
                    />
                  </div>
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
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button onClick={handleSubmit} disabled={createMaterialMutation.isPending || updateMaterialMutation.isPending}>
                    {editingMaterial ? "Güncelle" : "Oluştur"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Materyal</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Herkese Açık</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.public}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kursa Özel</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {materials.filter(m => m.courseId).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Genel</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {materials.filter(m => !m.courseId).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Materyal ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Materyal Tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="book">Kitap</SelectItem>
                <SelectItem value="slide">Slayt</SelectItem>
                <SelectItem value="text">Metin</SelectItem>
                <SelectItem value="document">Döküman</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="link">Link</SelectItem>
                <SelectItem value="image">Görsel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Materials List */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Yükleniyor...</p>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Henüz materyal bulunmamaktadır</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material) => (
                <Card key={material.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getMaterialIcon(material.materialType)}
                        <div>
                          <CardTitle className="text-lg">
                            {material.titleTr || material.title}
                          </CardTitle>
                          <CardDescription>
                            {getMaterialTypeLabel(material.materialType)}
                            {material.courseName && ` • ${material.courseName}`}
                          </CardDescription>
                        </div>
                      </div>
                      {material.isPublic && (
                        <Badge variant="secondary">Herkese Açık</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {material.descriptionTr || material.description}
                    </p>
                    {material.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {material.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {material.subjectArea && (
                      <Badge variant="outline" className="mt-2">
                        {material.subjectArea}
                      </Badge>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {new Date(material.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAssigningMaterial(material);
                          setSelectedStudentId(null);
                          setAssignmentNotes("");
                        }}
                        title="Öğrenciye Ata"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(material)}
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(material)}
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assign Material Dialog */}
      <Dialog open={!!assigningMaterial} onOpenChange={(open) => !open && setAssigningMaterial(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Materyal Ata</DialogTitle>
            <DialogDescription>
              "{assigningMaterial?.titleTr || assigningMaterial?.title}" materyalini bir öğrenciye atayın
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="student">Öğrenci</Label>
              <Select
                value={selectedStudentId?.toString() || ""}
                onValueChange={(value) => setSelectedStudentId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Öğrenci seçin" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student: any) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.displayName || student.username || `Kullanıcı ${student.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assignmentNotes">Notlar (Opsiyonel)</Label>
              <Textarea
                id="assignmentNotes"
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Bu materyal için özel notlar..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssigningMaterial(null)}>
              İptal
            </Button>
            <Button
              onClick={() => {
                if (assigningMaterial && selectedStudentId) {
                  assignMaterialMutation.mutate({
                    materialId: assigningMaterial.id,
                    studentId: selectedStudentId,
                    notes: assignmentNotes || undefined,
                  });
                }
              }}
              disabled={!selectedStudentId || assignMaterialMutation.isPending}
            >
              Ata
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

