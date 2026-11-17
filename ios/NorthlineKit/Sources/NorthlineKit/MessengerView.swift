import SwiftUI

public struct NorthlineMessenger: View {
    @Bindable var client: Northline
    @State private var draft = ""

    public init(client: Northline = .shared) {
        self.client = client
    }

    public var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 12) {
                    ForEach(client.messages) { message in
                        MessageRow(message: message)
                    }
                }
                .padding(16)
            }
            if let call = client.call, call.phase != .ended {
                callBar(call)
            }
            if let lastError = client.lastError {
                Text(lastError)
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
            }
            HStack(alignment: .bottom, spacing: 8) {
                TextField("Message", text: $draft, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(1 ... 4)
                Button {
                    Task { await send() }
                } label: {
                    Text("Send")
                }
                .buttonStyle(.borderedProminent)
                .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || client.isSending)
            }
            .padding(16)
        }
        .task {
            while !Task.isCancelled {
                try? await client.refresh()
                try? await Task.sleep(for: .seconds(3))
            }
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Call") {
                    Task { try? await client.startCall() }
                }
                .disabled(client.user == nil || client.call != nil)
            }
        }
    }

    private func callBar(_ call: NorthlineCall) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(call.phase == .active ? "On the line" : "Ringing the desk")
                    .font(.subheadline.weight(.semibold))
                Text("Voice stays on this conversation")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            if call.phase == .ringing {
                Button("Answer") {
                    Task { try? await client.answer() }
                }
            }
            Button(call.phase == .active ? "End" : "Cancel") {
                Task { try? await client.endCall() }
            }
        }
        .padding(16)
        .background(.quaternary)
    }

    private func send() async {
        let text = draft
        draft = ""
        do {
            try await client.send(text)
        } catch {
            draft = text
        }
    }
}

private struct MessageRow: View {
    var message: NorthlineMessage

    var body: some View {
        VStack(alignment: message.role == .customer ? .trailing : .leading, spacing: 4) {
            Text(message.author)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(message.body)
                .padding(10)
                .background(message.role == .customer ? Color.accentColor : Color.secondary.opacity(0.15))
                .foregroundStyle(message.role == .customer ? Color.white : Color.primary)
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .frame(maxWidth: .infinity, alignment: message.role == .customer ? .trailing : .leading)
    }
}
