import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Course } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Edit, Save, X, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CourseManager() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Course>>({});

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<Course> }) => {
      const response = await apiRequest("PATCH", `/api/courses/${data.id}`, data.updates);
      if (!response.ok) throw new Error("Failed to update course");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Success",
        description: "Course updated successfully",
      });
      setEditingId(null);
      setFormData({});
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (course: Course) => {
    setEditingId(course.id);
    setFormData(course);
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        updates: {
          price: formData.price ? String(parseFloat(String(formData.price))) : "0",
          isPremium: formData.isPremium,
          level: formData.level ? String(formData.level) : undefined,
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Course Management</CardTitle>
          <CardDescription>Edit course prices and features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courses.map((course) => (
              <Card key={course.id} className="p-4 bg-gray-50">
                {editingId === course.id ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Course Title</Label>
                      <Input
                        value={course.titleEn || course.title}
                        disabled
                        className="bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price || "0"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              price: e.target.value || "0",
                            })
                          }
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <Label>Level</Label>
                        <Select
                          value={formData.level || ""}
                          onValueChange={(value) =>
                            setFormData({ ...formData, level: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Switch
                        checked={formData.isPremium || false}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isPremium: checked })
                        }
                      />
                      <Label>Premium Course (Requires Payment)</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        className="flex-1"
                      >
                        {updateMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingId(null);
                          setFormData({});
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {course.titleEn || course.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>
                            {Number(course.price || 0).toFixed(2)}
                          </span>
                        </div>
                        <span>Level: {course.level || "Not set"}</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            course.isPremium
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {course.isPremium ? "Premium" : "Free"}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleEdit(course)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
