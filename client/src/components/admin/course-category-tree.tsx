import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Course } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronDown, ChevronRight, Edit, Trash2, Plus, DollarSign, BookOpen, FolderPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CourseNode extends Course {
  children?: CourseNode[];
}

export function CourseCategoryTree() {
  const { toast } = useToast();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Course>>({});
  const [newCourseParentId, setNewCourseParentId] = useState<number | null>(null);
  const [showNewCourseDialog, setShowNewCourseDialog] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");

  const { data: courses = [], isLoading } = useQuery<CourseNode[]>({
    queryKey: ["/api/courses/tree"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<Course> }) => {
      const response = await apiRequest("PATCH", `/api/courses/${data.id}`, data.updates);
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses/tree"] });
      toast({ title: "Success", description: "Course updated" });
      setEditingId(null);
      setEditForm({});
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update course", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await apiRequest("DELETE", `/api/courses/${courseId}`);
      if (!response.ok) throw new Error("Failed to delete");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses/tree"] });
      toast({ title: "Success", description: "Course deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete course", variant: "destructive" });
    },
  });

  const toggleExpand = (id: number) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  const handleEdit = (course: Course) => {
    setEditingId(course.id);
    setEditForm(course);
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        updates: {
          price: editForm.price ? String(parseFloat(String(editForm.price))) : "0",
          isPremium: editForm.isPremium,
          level: editForm.level ? String(editForm.level) : undefined,
          titleEn: editForm.titleEn,
        },
      });
    }
  };

  const renderCourseNode = (course: CourseNode, depth: number = 0) => {
    const hasChildren = course.children && course.children.length > 0;
    const isExpanded = expandedIds.has(course.id);
    const isEditing = editingId === course.id;

    return (
      <div key={course.id}>
        <div className={`flex items-center gap-2 p-3 ${depth > 0 ? "ml-8" : ""} border-b hover:bg-gray-50 rounded-lg transition`}>
          {hasChildren && (
            <button
              onClick={() => toggleExpand(course.id)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}

          <BookOpen className="h-4 w-4 text-blue-600" />

          {isEditing ? (
            <div className="flex-1 flex gap-2 items-center">
              <Input
                value={editForm.titleEn || ""}
                onChange={(e) => setEditForm({ ...editForm, titleEn: e.target.value })}
                className="text-sm"
              />
              <Input
                type="number"
                step="0.01"
                value={typeof editForm.price === 'string' ? editForm.price : (typeof editForm.price === 'number' ? String(editForm.price) : "0")}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                placeholder="Price"
                className="w-24 text-sm"
              />
              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{course.titleEn || course.title}</span>
                {Number(course.price) > 0 && (
                  <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    <DollarSign className="h-3 w-3" />
                    {Number(course.price).toFixed(2)}
                  </span>
                )}
                {course.isPremium && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Premium</span>
                )}
              </div>
              <p className="text-xs text-gray-500">{course.level || "Level not set"}</p>
            </div>
          )}

          {!isEditing && (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => handleEdit(course)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteMutation.mutate(course.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {course.children!.map((child) => renderCourseNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Course & Category Tree</CardTitle>
              <CardDescription>View and manage courses hierarchically</CardDescription>
            </div>
            <Dialog open={showNewCourseDialog} onOpenChange={setShowNewCourseDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Course
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Course</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Course Name</Label>
                    <Input
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      placeholder="Enter course name"
                    />
                  </div>
                  <div>
                    <Label>Parent Category (Optional)</Label>
                    <Select
                      value={newCourseParentId?.toString() || "none"}
                      onValueChange={(val) => setNewCourseParentId(val === "none" ? null : parseInt(val))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Root (No parent)</SelectItem>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.titleEn || course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => {
                    setShowNewCourseDialog(false);
                    toast({ title: "Info", description: "Course creation coming soon" });
                  }}>
                    Create Course
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {courses.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">No courses found</p>
            ) : (
              courses.map((course) => renderCourseNode(course))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
