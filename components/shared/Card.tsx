import React from 'react';

import {
  Card as CardUi,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const Card = ({ children }: { children: React.ReactNode }) => {
  return <CardUi className="w-full">{children}</CardUi>;
};

const Title = ({ children }: { children: React.ReactNode }) => {
  return <CardTitle className="text-xl tracking-tight">{children}</CardTitle>;
};

const Description = ({ children }: { children: React.ReactNode }) => {
  return <CardDescription>{children}</CardDescription>;
};

const Header = ({ children }: { children: React.ReactNode }) => {
  return <CardHeader className="px-0">{children}</CardHeader>;
};

const Body = ({ children }: { children: React.ReactNode }) => {
  return <CardContent className="flex flex-col gap-4">{children}</CardContent>;
};

const Footer = ({ children }: { children: React.ReactNode }) => {
  return <CardFooter className="justify-end">{children}</CardFooter>;
};

Card.Body = Body;
Card.Title = Title;
Card.Description = Description;
Card.Header = Header;
Card.Footer = Footer;

export default Card;
