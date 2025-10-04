import { Navigation } from "@/components/Navigation";
import qrCodePix from "@/assets/qrcode-pix.png";

export default function Donations() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex flex-col items-center space-y-8">
          {/* QR Code */}
          <div className="w-full max-w-md">
            <img 
              src={qrCodePix} 
              alt="QR Code PIX para doações" 
              className="w-full h-auto rounded-lg shadow-manga"
            />
          </div>

          {/* Mensagem */}
          <div className="text-center space-y-6 px-4">
            <h1 className="text-3xl md:text-4xl font-bold text-manga-text-primary leading-relaxed">
              📖✨ Você está no prólogo de uma nova história!
            </h1>
            
            <div className="text-base md:text-lg text-manga-text-secondary leading-relaxed space-y-4">
              <p>
                Este site de manhwas e mangás nasceu da paixão de fã para fã, de leitor para leitor — criado para dar a todos nós um espaço limpo, livre do caos de propagandas, onde a única coisa que importa é mergulhar de verdade na leitura.
              </p>
              
              <p>
                Mas, como em toda grande saga, o início pede aliados. Precisamos de força extra para manter os custos de servidor, hospedagem e trazer melhorias constantes.
              </p>
              
              <p>
                E é aqui que você entra: com um Pix de qualquer valor ou com suas ideias e sugestões, você se torna parte desse crescimento 💡💜.
              </p>
              
              <p className="font-semibold text-manga-text-primary">
                Porque este não é só um site. É um projeto feito por leitores para leitores.
              </p>
              
              <p>
                E apoiar desde o começo é como estar nos primeiros capítulos de uma obra épica — aqueles que só os verdadeiros fãs lembram e carregam com orgulho. 🚀🔥
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
