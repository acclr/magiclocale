const LetterAvatar = ({ name }: { name: string }) => {
  return (
    <div className="flex size-6 items-center justify-center rounded-md bg-secondary text-[11px] font-medium text-secondary-foreground">
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

export default LetterAvatar;
