import { useEffect, useRef, useState } from 'react';
import type { DetectedFood } from '../../services/googleVision';

interface FoodDetectionImageProps {
  imageUrl: string;
  detectedFoods: DetectedFood[];
}

export default function FoodDetectionImage({ imageUrl, detectedFoods }: FoodDetectionImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;

    const handleImageLoad = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 캔버스 크기를 이미지 크기에 맞춤
      canvas.width = image.width;
      canvas.height = image.height;
      setImageDimensions({ width: image.width, height: image.height });

      // 투명한 캔버스에 바운딩 박스만 그리기
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 바운딩 박스가 있는 음식만 그리기
      detectedFoods
        .filter((food) => food.boundingBox)
        .forEach((food, index) => {
          const box = food.boundingBox!;
          const x = box.x * canvas.width;
          const y = box.y * canvas.height;
          const width = box.width * canvas.width;
          const height = box.height * canvas.height;

          // 파스텔 색상 배열
          const colors = [
            '#dfb0f2', // 라벤더 (primary)
            '#FFE5D0', // 아침 오렌지
            '#D0F5E5', // 점심 민트
            '#E5D0FF', // 저녁 퍼플
            '#FFF4D0', // 노란색
            '#FFD0E5', // 핑크
          ];
          const color = colors[index % colors.length];

          // 박스 그리기
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);

          // 배경이 있는 라벨
          ctx.fillStyle = color;
          ctx.fillRect(x, y - 28, width, 28);

          // 텍스트
          ctx.fillStyle = '#191919';
          ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          const label = `${food.name} (${Math.round(food.confidence * 100)}%)`;
          ctx.fillText(label, x + 8, y - 14);
        });
    };

    if (image.complete) {
      handleImageLoad();
    } else {
      image.addEventListener('load', handleImageLoad);
      return () => image.removeEventListener('load', handleImageLoad);
    }
  }, [detectedFoods, imageUrl]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-surface">
      <img
        ref={imageRef}
        src={imageUrl}
        alt="업로드한 음식"
        className="w-full h-auto"
        crossOrigin="anonymous"
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />
    </div>
  );
}
