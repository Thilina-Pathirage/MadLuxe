"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  IconArrowDown,
  IconArrowUp,
  IconPhoto,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import PageContainer from "@/app/portal/components/container/PageContainer";
import PageHeader from "@/components/madlaxue/shared/PageHeader";
import { api, type ImageAsset } from "@/lib/api";
import { normalizeVariantImageUrl } from "@/utils/variantImage";

const MAX_SLIDES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

type EditableSlide = {
  id: string;
  title: string;
  subtitle: string;
  image: ImageAsset | null;
  sortOrder: number;
};

const createEmptySlide = (index: number): EditableSlide => ({
  id: `temp-${Date.now()}-${index}`,
  title: "",
  subtitle: "",
  image: null,
  sortOrder: index,
});

const serializeSettings = (slides: EditableSlide[], heroAutoSlide: boolean) =>
  JSON.stringify(
    {
      heroAutoSlide,
      slides: slides.map((slide, index) => ({
        title: slide.title.trim(),
        subtitle: slide.subtitle.trim(),
        sortOrder: index,
        image: slide.image
          ? {
              fileId: slide.image.fileId,
              filename: slide.image.filename,
              contentType: slide.image.contentType,
              size: slide.image.size,
              url: slide.image.url,
            }
          : null,
      })),
    }
  );

export default function ManageWebsitePage() {
  const [slides, setSlides] = useState<EditableSlide[]>([]);
  const [heroAutoSlide, setHeroAutoSlide] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);
  const [initialState, setInitialState] = useState<string>("");
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState<"success" | "error">("success");

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await api.getWebsiteSettings();
      const resolvedAutoSlide = response.data?.heroAutoSlide !== false;
      const remoteSlides = (response.data?.heroSlides ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((slide, index) => ({
          id: slide._id ?? `remote-${index}`,
          title: slide.title,
          subtitle: slide.subtitle,
          image: slide.image ?? null,
          sortOrder: Number.isFinite(Number(slide.sortOrder)) ? slide.sortOrder : index,
        }));

      const resolvedSlides = remoteSlides.length > 0 ? remoteSlides : [createEmptySlide(0)];
      setSlides(resolvedSlides);
      setHeroAutoSlide(resolvedAutoSlide);
      setInitialState(serializeSettings(resolvedSlides, resolvedAutoSlide));
    } catch (err) {
      setSnackSeverity("error");
      setSnackMsg(err instanceof Error ? err.message : "Failed to load website settings.");
      const fallbackSlides = [createEmptySlide(0)];
      setSlides(fallbackSlides);
      setHeroAutoSlide(true);
      setInitialState(serializeSettings(fallbackSlides, true));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const isDirty = useMemo(
    () => serializeSettings(slides, heroAutoSlide) !== initialState,
    [slides, heroAutoSlide, initialState]
  );

  const handleSlideChange = (id: string, key: "title" | "subtitle", value: string) => {
    setSlides((prev) => prev.map((slide) => (slide.id === id ? { ...slide, [key]: value } : slide)));
  };

  const handleAddSlide = () => {
    setSlides((prev) => {
      if (prev.length >= MAX_SLIDES) return prev;
      return [...prev, createEmptySlide(prev.length)];
    });
  };

  const handleRemoveSlide = (id: string) => {
    setSlides((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((slide) => slide.id !== id);
    });
  };

  const moveSlide = (index: number, direction: "up" | "down") => {
    setSlides((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleImageUpload = async (slideId: string, file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setSnackSeverity("error");
      setSnackMsg("Only PNG, JPG and WebP images are allowed.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSnackSeverity("error");
      setSnackMsg("Image must be 5MB or smaller.");
      return;
    }

    setUploadingSlideId(slideId);
    try {
      const response = await api.uploadWebsiteHeroImage(file);
      const uploadedImage = response.data;
      setSlides((prev) =>
        prev.map((slide) =>
          slide.id === slideId
            ? {
                ...slide,
                image: uploadedImage,
              }
            : slide
        )
      );
      setSnackSeverity("success");
      setSnackMsg("Hero image uploaded. Save changes to publish it.");
    } catch (err) {
      setSnackSeverity("error");
      setSnackMsg(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploadingSlideId(null);
    }
  };

  const handleSave = async () => {
    const hasInvalidSlide = slides.some((slide) => !slide.title.trim() || !slide.subtitle.trim());
    if (hasInvalidSlide) {
      setSnackSeverity("error");
      setSnackMsg("Each slide needs both title and subtitle.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        heroAutoSlide,
        heroSlides: slides.map((slide, index) => ({
          title: slide.title.trim(),
          subtitle: slide.subtitle.trim(),
          image: slide.image,
          sortOrder: index,
        })),
      };

      const response = await api.updateWebsiteSettings(payload);
      const normalizedSlides = (response.data?.heroSlides ?? payload.heroSlides)
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((slide, index) => ({
          id: slide._id ?? `saved-${index}`,
          title: slide.title,
          subtitle: slide.subtitle,
          image: slide.image ?? null,
          sortOrder: slide.sortOrder,
        }));

      setSlides(normalizedSlides);
      const resolvedAutoSlide = response.data?.heroAutoSlide !== false;
      setHeroAutoSlide(resolvedAutoSlide);
      setInitialState(serializeSettings(normalizedSlides, resolvedAutoSlide));
      setSnackSeverity("success");
      setSnackMsg("Website hero settings saved.");
    } catch (err) {
      setSnackSeverity("error");
      setSnackMsg(err instanceof Error ? err.message : "Failed to save website settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    try {
      const parsed = JSON.parse(initialState) as
        | {
            heroAutoSlide?: boolean;
            slides?: Array<{
              title: string;
              subtitle: string;
              image: ImageAsset | null;
              sortOrder: number;
            }>;
          }
        | Array<{
            title: string;
            subtitle: string;
            image: ImageAsset | null;
            sortOrder: number;
          }>;

      const savedSlides = Array.isArray(parsed) ? parsed : (parsed.slides ?? []);
      const savedAutoSlide = Array.isArray(parsed) ? true : parsed.heroAutoSlide !== false;

      const restored = savedSlides.map((slide, index) => ({
        id: `reset-${index}-${Date.now()}`,
        title: slide.title,
        subtitle: slide.subtitle,
        image: slide.image,
        sortOrder: slide.sortOrder,
      }));

      setHeroAutoSlide(savedAutoSlide);
      setSlides(restored);
    } catch {
      // Keep current form state if parsing fails.
    }
  };

  return (
    <PageContainer title="Manage Website" description="Control public landing hero content">
      <PageHeader
        title="Manage Website"
        subtitle="Edit hero slides shown on the landing page. Buttons stay fixed across all slides."
        actions={
          <Button
            variant="contained"
            size="small"
            startIcon={<IconPlus size={16} />}
            disabled={slides.length >= MAX_SLIDES || loading}
            onClick={handleAddSlide}
          >
            Add Slide
          </Button>
        }
      />

      <Alert severity="info" sx={{ mb: 2.5 }}>
        Fixed CTA buttons for every slide: <strong>Shop Collection</strong> and <strong>Shop All</strong>.
      </Alert>
      <FormControlLabel
        sx={{ mb: 2 }}
        control={
          <Switch
            checked={heroAutoSlide}
            onChange={(_, checked) => setHeroAutoSlide(checked)}
            color="primary"
          />
        }
        label="Hero slider auto change"
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: "grid", gap: 2 }}>
          {slides.map((slide, index) => {
            const imageUrl = normalizeVariantImageUrl(slide.image?.url);
            const isUploading = uploadingSlideId === slide.id;

            return (
              <Card key={slide.id}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="h6" sx={{ color: "primary.dark" }}>
                      Slide {index + 1}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton
                        size="small"
                        disabled={index === 0}
                        onClick={() => moveSlide(index, "up")}
                        aria-label="Move slide up"
                      >
                        <IconArrowUp size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={index === slides.length - 1}
                        onClick={() => moveSlide(index, "down")}
                        aria-label="Move slide down"
                      >
                        <IconArrowDown size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={slides.length <= 1}
                        onClick={() => handleRemoveSlide(slide.id)}
                        sx={{ color: "error.main" }}
                        aria-label="Remove slide"
                      >
                        <IconTrash size={16} />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "240px 1fr" } }}>
                    <Box>
                      <Box
                        sx={{
                          width: "100%",
                          aspectRatio: "4 / 3",
                          borderRadius: "10px",
                          border: "1px dashed",
                          borderColor: "divider",
                          bgcolor: "grey.100",
                          overflow: "hidden",
                          display: "grid",
                          placeItems: "center",
                          mb: 1,
                        }}
                      >
                        {imageUrl ? (
                          <Box
                            component="img"
                            src={imageUrl}
                            alt={`Hero slide ${index + 1}`}
                            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <Box sx={{ textAlign: "center", color: "text.disabled" }}>
                            <IconPhoto size={24} stroke={1.5} />
                            <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                              No image selected
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          component="label"
                          variant="outlined"
                          size="small"
                          disabled={isUploading}
                          fullWidth
                        >
                          {isUploading ? "Uploading..." : "Upload"}
                          <input
                            hidden
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) {
                                void handleImageUpload(slide.id, file);
                              }
                              event.target.value = "";
                            }}
                          />
                        </Button>
                        <Button
                          variant="text"
                          color="error"
                          size="small"
                          disabled={!slide.image}
                          onClick={() =>
                            setSlides((prev) =>
                              prev.map((item) =>
                                item.id === slide.id
                                  ? {
                                      ...item,
                                      image: null,
                                    }
                                  : item
                              )
                            )
                          }
                        >
                          Remove
                        </Button>
                      </Box>
                    </Box>

                    <Box sx={{ display: "grid", gap: 1.5 }}>
                      <TextField
                        label="Title"
                        size="small"
                        fullWidth
                        value={slide.title}
                        onChange={(event) => handleSlideChange(slide.id, "title", event.target.value)}
                      />
                      <TextField
                        label="Subtitle"
                        size="small"
                        fullWidth
                        multiline
                        minRows={3}
                        value={slide.subtitle}
                        onChange={(event) => handleSlideChange(slide.id, "subtitle", event.target.value)}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 2.5 }}>
        <Button variant="outlined" size="large" disabled={loading || saving || !isDirty} onClick={handleReset}>
          Reset
        </Button>
        <Button
          variant="contained"
          size="large"
          disabled={loading || saving || !isDirty}
          onClick={handleSave}
          sx={{ minWidth: 160 }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </Box>

      <Snackbar
        open={!!snackMsg}
        autoHideDuration={3200}
        onClose={() => setSnackMsg("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackSeverity} variant="filled" onClose={() => setSnackMsg("")}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}
