import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Heading,
    Hr,
    Preview,
    Tailwind,
} from "@react-email/components"

interface FeedbackEmailProps {
    name: string
    email: string
    message: string
}

export function FeedbackEmail({ name, email, message }: FeedbackEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>New feedback from {name}</Preview>
            <Tailwind>
                <Body className="bg-[#f6f9fc] font-sans">
                    <Container className="mx-auto py-8 px-4 max-w-[560px]">
                        {/* Header */}
                        <Section className="bg-[#0a0a0a] rounded-t-lg px-8 py-6 text-center">
                            <Heading className="text-white text-xl m-0 font-bold tracking-tight">
                                🔧 WrenchCloud
                            </Heading>
                            <Text className="text-[#a0a0a0] text-sm m-0 mt-1">
                                New Feedback Received
                            </Text>
                        </Section>

                        {/* Body */}
                        <Section className="bg-white rounded-b-lg px-8 py-6 border border-t-0 border-solid border-[#e6ebf1]">
                            {/* Sender Info */}
                            <Section className="bg-[#f8fafc] rounded-lg px-5 py-4 mb-4">
                                <Text className="text-[#525f7f] text-xs m-0 uppercase font-semibold tracking-wider">
                                    From
                                </Text>
                                <Text className="text-[#1a1a2e] text-base m-0 mt-1 font-medium">
                                    {name}
                                </Text>
                                <Text className="text-[#525f7f] text-sm m-0 mt-0.5">
                                    {email}
                                </Text>
                            </Section>

                            <Hr className="border-[#e6ebf1] my-4" />

                            {/* Message */}
                            <Text className="text-[#525f7f] text-xs m-0 uppercase font-semibold tracking-wider">
                                Message
                            </Text>
                            <Text className="text-[#1a1a2e] text-sm leading-6 mt-2 mb-0 whitespace-pre-wrap">
                                {message}
                            </Text>

                            <Hr className="border-[#e6ebf1] my-4" />

                            {/* Footer */}
                            <Text className="text-[#8898aa] text-xs m-0 text-center">
                                Sent via WrenchCloud Feedback Form •{" "}
                                {new Date().toLocaleString("en-IN", {
                                    timeZone: "Asia/Kolkata",
                                })}
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    )
}

export default FeedbackEmail
