import { Layout } from "../Layout/Layout"

export const NotFoundPage = () => (
  <Layout>
    <div className="flex w-full justify-center items-center"></div>
    <p className="flex justify-center items-center text-8xl text-teal-600 font-bold mt-16">404</p>
    <p className="text-4xl text-center text-teal-600">Page not found</p>
    <p className="text-center">The page you are trying to access does not exist.</p>
  </Layout>
)
