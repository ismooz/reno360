
interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  alt: string;
}

const Image = ({ alt, ...props }: ImageProps) => {
  return (
    <img
      loading="lazy"
      alt={alt}
      {...props}
    />
  );
};

export default Image;
