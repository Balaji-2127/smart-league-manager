/**
 * src/api/apollo.js
 * Apollo Client configuration for Smart League Manager.
 */
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'

const httpLink = createHttpLink({
    uri: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace('/api', '')}/graphql` : 'http://localhost:5000/graphql',
})

const authLink = setContext((_, { headers }) => {
    // Get token from localStorage
    const token = localStorage.getItem('slm_token')
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
        }
    }
})

const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
})

export default client
