import RainbowKitAndChakraProvider from './RainbowKitAndChakraProvider';

import { ChakraProvider } from '@chakra-ui/react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <RainbowKitAndChakraProvider>
          <ChakraProvider>
            {children}
          </ChakraProvider>
        </RainbowKitAndChakraProvider>
      </body>
    </html>
  );
}
