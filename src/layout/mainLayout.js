import Head from "next/head";

export default function MainLayout({children}) {
    return (
        <>
            <Head>
                <title>Змейка</title>
                <meta name="description" content="Змееееееейка" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="./Gadsden_snake.png" />
            </Head>
            {children}
        </>
    )
}