const API_BASE = 'http://localhost:8000';

class ApiService {
    constructor() {
        this.baseUrl = API_BASE;
    }

    async request(url, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${url}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async get(url, params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(query ? `${url}?${query}` : url);
    }

    async post(url, data = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Поиск
    async searchPerson(name) {
        return this.get('/country/searchperson', { name: encodeURIComponent(name) });
    }

    async searchAdvanced(criteria) {
        return this.post('/country/searchinfo', criteria);
    }

    // Семья и дерево
    async getPersonInfo(personId, familyId) {
        return this.post('/family/getbyId', {
            idPerson: parseInt(personId),
            idFamily: parseInt(familyId)
        });
    }

    async getFamilyTree(personId, familyId, maxGeneration = 3) {
        return this.post('/family/get_family_tree', {
            idPerson: parseInt(personId),
            idFamily: parseInt(familyId),
            max_generation: parseInt(maxGeneration)
        });
    }

    // Профиль
    async changePassword(personId, currentPassword, newPassword) {
        return this.post('/person/password', {
            idPerson: parseInt(personId),
            password: currentPassword,
            new_password: newPassword
        });
    }

    // География
    async getCountries() {
        return this.get('/country/getallcountry');
    }

    async getRegions(countryId) {
        return this.get('/country/regionsofcountry', { id: countryId });
    }

    async getCities(regionId) {
        return this.get('/country/cityesofregion', { id: regionId });
    }

    async login(email, password) {
        return this.post('/auth/login', { email, password });
    }

    async register(data) {
        return this.post('/auth/register', data);
    }

    async createPerson(data) {
        return this.post('/person/create', data);
    }

    async addRelationship(data) {
        return this.post('/relationship/add', data);
    }

    async searchPublicTrees(surname) {
        return this.post('/family/public_trees', { surname });
    }

    async getUserFamilies(userId) {
        return this.post('/user/families', { user_id: userId });
    }

    async addPersonWithRelation(data) {
        return this.post('/person/add_with_relation', data);
    }
}

const api = new ApiService();
