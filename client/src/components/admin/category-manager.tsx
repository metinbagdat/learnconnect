import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/consolidated-language-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, FolderTree, Loader2 } from "lucide-react";
import { CourseCategory } from "@shared/schema";

interface ExtendedCategory extends CourseCategory {
  depth?: number;
  parentCategoryId?: number | null;
}

interface CategoryFormData {
  nameEn: string;
  nameTr: string;
  parentCategoryId?: number | null;
  order: number;
}

export function CategoryManager() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<ExtendedCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    nameEn: "",
    nameTr: "",
    parentCategoryId: null,
    order: 0,
  });

  const { data: categoriesData, isLoading } = useQuery<any>({
    queryKey: ["/api/categories/tree"],
  });
  
  const categories: ExtendedCategory[] = Array.isArray(categoriesData) ? categoriesData : [];

  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      let depth = 0;
      if (data.parentCategoryId) {
        const parent = categories.find((c: ExtendedCategory) => c.id === data.parentCategoryId);
        depth = parent ? (parent.depth || 0) + 1 : 1;
      }
      return apiRequest("POST", "/api/categories", {
        ...data,
        depth,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories/tree"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: language === 'tr' ? "Başarılı" : "Success",
        description: language === 'tr' ? "Kategori oluşturuldu" : "Category created successfully",
      });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: language === 'tr' ? "Hata" : "Error",
        description: error.message || (language === 'tr' ? "Kategori oluşturulamadı" : "Failed to create category"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CategoryFormData> }) => {
      return apiRequest("PATCH", `/api/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories/tree"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: language === 'tr' ? "Başarılı" : "Success",
        description: language === 'tr' ? "Kategori güncellendi" : "Category updated successfully",
      });
      setEditCategory(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: language === 'tr' ? "Hata" : "Error",
        description: error.message || (language === 'tr' ? "Kategori güncellenemedi" : "Failed to update category"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories/tree"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: language === 'tr' ? "Başarılı" : "Success",
        description: language === 'tr' ? "Kategori silindi" : "Category deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'tr' ? "Hata" : "Error",
        description: error.message || (language === 'tr' ? "Kategori silinemedi" : "Failed to delete category"),
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      nameEn: "",
      nameTr: "",
      parentCategoryId: null,
      order: 0,
    });
  };

  const handleSubmit = () => {
    if (!formData.nameEn || !formData.nameTr) {
      toast({
        title: language === 'tr' ? "Hata" : "Error",
        description: language === 'tr' ? "Lütfen tüm alanları doldurun" : "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (editCategory) {
      updateMutation.mutate({ id: editCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (category: ExtendedCategory) => {
    setEditCategory(category);
    setFormData({
      nameEn: category.nameEn,
      nameTr: category.nameTr,
      parentCategoryId: category.parentCategoryId,
      order: category.order,
    });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(language === 'tr' 
      ? "Bu kategoriyi silmek istediğinizden emin misiniz?" 
      : "Are you sure you want to delete this category?")) {
      deleteMutation.mutate(id);
    }
  };

  const renderCategoryTree = (cats: ExtendedCategory[], depth = 0) => {
    return cats.map((category) => {
      const children = categories.filter((c: ExtendedCategory) => (c.parentCategoryId ?? null) === category.id);
      const hasChildren = children.length > 0;

      return (
        <div key={category.id} className="mb-2" style={{ marginLeft: `${depth * 20}px` }}>
          <div className="flex items-center gap-2 p-3 bg-white border rounded-lg hover:bg-neutral-50 transition-colors">
            <FolderTree className="h-4 w-4 text-neutral-500" />
            <div className="flex-1">
              <div className="font-medium">
                {language === 'tr' ? category.nameTr : category.nameEn}
              </div>
              <div className="text-xs text-neutral-500">
                {language === 'tr' ? 'Sıra' : 'Order'}: {category.order} | 
                {language === 'tr' ? ' Seviye' : ' Depth'}: {category.depth || 0}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(category)}
                data-testid={`button-edit-category-${category.id}`}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(category.id)}
                disabled={hasChildren || deleteMutation.isPending}
                data-testid={`button-delete-category-${category.id}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {hasChildren && renderCategoryTree(children, depth + 1)}
        </div>
      );
    });
  };

  const rootCategories = categories.filter(c => !c.parentCategoryId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle data-testid="text-category-title">
              {language === 'tr' ? 'Kategori Yönetimi' : 'Category Management'}
            </CardTitle>
            <CardDescription>
              {language === 'tr' 
                ? 'Kurs kategorilerini oluşturun ve yönetin' 
                : 'Create and manage course categories'}
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen || !!editCategory} onOpenChange={(open) => {
            if (!open) {
              setIsCreateOpen(false);
              setEditCategory(null);
              resetForm();
            } else {
              setIsCreateOpen(true);
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-category">
                <Plus className="h-4 w-4 mr-2" />
                {language === 'tr' ? 'Yeni Kategori' : 'New Category'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editCategory 
                    ? (language === 'tr' ? 'Kategoriyi Düzenle' : 'Edit Category')
                    : (language === 'tr' ? 'Yeni Kategori Oluştur' : 'Create New Category')}
                </DialogTitle>
                <DialogDescription>
                  {language === 'tr' 
                    ? 'Kategori bilgilerini doldurun' 
                    : 'Fill in the category information'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nameEn">
                    {language === 'tr' ? 'İngilizce Ad' : 'English Name'}
                  </Label>
                  <Input
                    id="nameEn"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    data-testid="input-category-name-en"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameTr">
                    {language === 'tr' ? 'Türkçe Ad' : 'Turkish Name'}
                  </Label>
                  <Input
                    id="nameTr"
                    value={formData.nameTr}
                    onChange={(e) => setFormData({ ...formData, nameTr: e.target.value })}
                    data-testid="input-category-name-tr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent">
                    {language === 'tr' ? 'Üst Kategori' : 'Parent Category'}
                  </Label>
                  <Select
                    value={formData.parentCategoryId?.toString() || "none"}
                    onValueChange={(value) => 
                      setFormData({ 
                        ...formData, 
                        parentCategoryId: value === "none" ? null : parseInt(value) 
                      })
                    }
                  >
                    <SelectTrigger data-testid="select-parent-category">
                      <SelectValue placeholder={language === 'tr' ? 'Seçiniz' : 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" data-testid="select-item-no-parent">
                        {language === 'tr' ? 'Üst Kategori Yok' : 'No Parent'}
                      </SelectItem>
                      {categories
                        .filter(c => !editCategory || c.id !== editCategory.id)
                        .map(cat => (
                          <SelectItem 
                            key={cat.id} 
                            value={cat.id.toString()}
                            data-testid={`select-item-category-${cat.id}`}
                          >
                            {language === 'tr' ? cat.nameTr : cat.nameEn}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order">
                    {language === 'tr' ? 'Sıra' : 'Order'}
                  </Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    data-testid="input-category-order"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditCategory(null);
                    resetForm();
                  }}
                  data-testid="button-cancel-category"
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-category"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {t('save')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-8 text-neutral-500" data-testid="text-no-categories">
            {language === 'tr' 
              ? 'Henüz kategori yok. Yeni kategori ekleyin.' 
              : 'No categories yet. Add a new category.'}
          </div>
        ) : (
          <div className="space-y-2" data-testid="category-tree">
            {renderCategoryTree(rootCategories)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
