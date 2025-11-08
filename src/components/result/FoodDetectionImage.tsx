interface FoodDetectionImageProps {
  imageUrl: string;
}

export default function FoodDetectionImage({ imageUrl }: FoodDetectionImageProps) {
  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-surface">
      <img
        src={imageUrl}
        alt="업로드한 음식"
        className="w-full h-auto"
      />
    </div>
  );
}
