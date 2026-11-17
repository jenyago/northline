import Foundation

public struct URLSessionTransport: NorthlineTransport, Sendable {
    public var baseURL: URL
    public var appId: String
    public var session: URLSession

    public init(baseURL: URL, appId: String, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.appId = appId
        self.session = session
    }

    public func send(_ request: NorthlineRequest) async throws -> NorthlineResponse {
        guard let url = endpoint(request.path) else {
            throw NorthlineError.decoding
        }
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = request.method
        urlRequest.httpBody = request.body
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue(appId, forHTTPHeaderField: "X-Northline-App-Id")
        let (data, response) = try await session.data(for: urlRequest)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        return NorthlineResponse(status: status, body: data)
    }

    private func endpoint(_ path: String) -> URL? {
        guard var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false) else {
            return nil
        }
        let base = components.path.hasSuffix("/") ? String(components.path.dropLast()) : components.path
        let extra = path.hasPrefix("/") ? path : "/" + path
        components.path = base + extra
        return components.url
    }
}
