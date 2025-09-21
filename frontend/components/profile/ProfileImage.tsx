"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { LoaderCircle, PencilIcon, UploadIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { convertBlobUrlToFile } from "@/utils/utils";
import { useSession } from "@/providers/SessionProvider";
import { uploadFile } from "@/utils/uploadFile";
import ApiClient from "@/utils/ApiClient";

async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop
): Promise<string> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise<string>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        resolve(url);
      } else {
        reject(new Error("Canvas is empty"));
      }
    }, "image/png");
  });
}

export default function ProfileImage({ user }: { user: User }) {
  const { setUser } = useSession();

  const [imageUrl, setImageUrl] = useState<string | null>(
    `/api/avatar?url=${user?.avatar}`
  );
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop | undefined>(undefined);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [uploading, startUploading] = useTransition();
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleOnImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSrc(URL.createObjectURL(file));
      setCrop(undefined);
      setCompletedCrop(null);
      setImageUrl(null);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
  };

  const handleUpload = () => {
    startUploading(async () => {
      try {
        if (!completedCrop) {
          toast.error("Crop the image too upload!!", {
            style: { background: "#ef4444", color: "#fff" }, // Tailwind red-500
          });
        }
        if (imgRef.current && completedCrop) {
          const url = await getCroppedImg(imgRef.current, completedCrop);
          const imageFile = await convertBlobUrlToFile(url);
          const { data, errorMessage } = await uploadFile({
            file: imageFile,
            folder: "avatars",
          });
          if (data) {
            const newAvatarUrl = `/api/avatar?url=${data.fileUrl}`;
            setImageUrl(newAvatarUrl);
            await ApiClient.post("/auth/user", { avatar: data.fileUrl });
            toast.success("Updated Profile Image successfully !!");
            setUser((prev) =>
              prev ? { ...prev, avatar: data.fileUrl } : prev
            );
            setSrc(null);
          } else if (errorMessage) {
            toast.error(errorMessage);
            return;
          }
        }
      } catch (error) {
        toast.error(
          `Error uploading image: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    });
  };

  return (
    <div className="flex flex-col">
      <div className="mx-auto">
        {!imageUrl && src ? (
          <div className="flex flex-col items-center gap-2">
            <span>(Crop and Upload)</span>
            <ReactCrop
              crop={crop}
              onChange={setCrop}
              onComplete={setCompletedCrop}
              aspect={1}
              circularCrop
            >
              <Image
                ref={imgRef}
                src={src}
                alt="profile-image-cropper"
                width={1000}
                height={1000}
                onLoad={onImageLoad}
                style={{ maxWidth: "100%" }}
              />
            </ReactCrop>
            <div className="flex flex-row gap-2">
              <Button variant="outline" onClick={handleUpload}>
                {uploading ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <UploadIcon />
                )}
                {uploading ? "Uploading..." : "Upload"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setSrc(null);
                  setImageUrl(user?.avatar || null);
                }}
              >
                <XIcon />
                Cancel
              </Button>
            </div>
          </div>
        ) : imageUrl ? (
          <>
            <div className="relative flex size-54 flex-col items-center justify-center overflow-hidden rounded-2xl">
              <Image
                src={imageUrl}
                alt="profile-image"
                width={500}
                height={500}
              />
            </div>
            <Button
              variant={"outline"}
              onClick={() => setImageUrl(null)}
              className="mx-auto mt-2 w-full"
            >
              <PencilIcon />
              Update
            </Button>
          </>
        ) : (
          <>
            <div
              className={cn(
                "relative flex flex-col items-center justify-center overflow-hidden rounded-xl outline-4 outline-[--border] outline-dashed",
                "bg-card aspect-square max-w-xs"
              )}
            >
              <input
                type="file"
                name="image"
                onChange={handleOnImageChange}
                className={cn("absolute h-full w-full opacity-0")}
              />
              <UploadIcon className="m-4 size-16 text-[--muted-foreground]" />
              <span className="mx-4 mb-4 text-lg font-bold text-[--foreground]">
                Upload Profile Image
              </span>
            </div>
            <Button
              variant="destructive"
              onClick={() => setImageUrl(`/api/avatar?url=${user?.avatar}`)}
              disabled={!user?.avatar}
              className="mx-auto mt-2 w-full"
            >
              <XIcon />
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
