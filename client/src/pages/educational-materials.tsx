import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { 
  FileText, 
  Video, 
  BookOpen, 
  Image as ImageIcon,
  Link as LinkIcon,
  File,
  Download,
  Search,
  Filter,
  Sparkles,
  BookMarked,
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
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { MaterialViewer } from "@/components/materials/material-viewer";

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
  createdAt: string;
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

export default function EducationalMaterials() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Fetch student materials
  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ["student-materials", user?.id],
    queryFn: async () => {
      const response = await apiRequest("/api/student/materials");
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch AI materials separately
  const { data: aiMaterials = [] } = useQuery<Material[]>({
    queryKey: ["ai-materials", user?.id],
    queryFn: async () => {
      const response = await apiRequest("/api/student/materials/ai");
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Filter materials based on search and type
  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = 
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedType === "all" || material.materialType === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Separate materials by category
  const allMaterials = filteredMaterials;
  const aiOnlyMaterials = aiMaterials.filter(m => m.isAiGenerated);
  const courseMaterials = filteredMaterials.filter(m => !m.isPublic && !m.isAiGenerated);
  const publicMaterials = filteredMaterials.filter(m => m.isPublic && !m.isAiGenerated);

  const materialsToShow = activeTab === "ai" 
    ? aiOnlyMaterials 
    : activeTab === "course" 
    ? courseMaterials 
    : activeTab === "public"
    ? publicMaterials
    : allMaterials;

  const handleMaterialClick = (material: Material) => {
    setSelectedMaterial(material);
    setViewerOpen(true);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Eğitim Materyalleri
            </h1>
            <p className="text-gray-600">
              Erişebileceğiniz tüm eğitim materyallerini buradan görüntüleyebilirsiniz
            </p>
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

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">Tümü</TabsTrigger>
              <TabsTrigger value="ai">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Materyalleri
              </TabsTrigger>
              <TabsTrigger value="course">Kurs Materyalleri</TabsTrigger>
              <TabsTrigger value="public">Genel Materyaller</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Yükleniyor...</p>
                </div>
              ) : materialsToShow.length === 0 ? (
                <div className="text-center py-12">
                  <BookMarked className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz materyal bulunmamaktadır</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {materialsToShow.map((material) => (
                    <Card 
                      key={material.id} 
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleMaterialClick(material)}
                    >
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
                              </CardDescription>
                            </div>
                          </div>
                          {material.isAiGenerated && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {material.descriptionTr || material.description}
                        </p>
                        {material.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
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
                      <CardFooter className="flex justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(material.createdAt).toLocaleDateString("tr-TR")}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMaterialClick(material);
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {material.externalUrl ? "Aç" : "İndir"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <MaterialViewer 
        material={selectedMaterial} 
        open={viewerOpen} 
        onOpenChange={setViewerOpen} 
      />
    </div>
  );
}

