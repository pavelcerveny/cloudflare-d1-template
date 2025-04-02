import { Button } from "@/components/ui/button"
import { SiGoogleauthenticator } from "@icons-pack/react-simple-icons";

export function GoogleSocialBtn() {

  return (
    <Button className="w-full" asChild size='lg'>
      <SiGoogleauthenticator className="w-[22px] h-[22px] mr-1" />
      Sign in with Google
    </Button>
  )
}
